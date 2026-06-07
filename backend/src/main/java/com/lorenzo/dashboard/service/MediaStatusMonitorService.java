package com.lorenzo.dashboard.service;

import com.lorenzo.dashboard.model.MediaStatus;
import com.lorenzo.dashboard.model.MediaStatuses;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class MediaStatusMonitorService {

    private static final MediaStatus EMPTY_STATUS = new MediaStatus("", "", false, false);

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private volatile MediaStatuses currentStatuses = new MediaStatuses(EMPTY_STATUS, EMPTY_STATUS);
    private Process monitorProcess;

    @PostConstruct
    public void start() throws IOException {
        String script = """
                Add-Type -AssemblyName System.Runtime.WindowsRuntime;
                [Console]::OutputEncoding = [Text.Encoding]::UTF8;
                $operationMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() |
                    Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } |
                    Select-Object -First 1;
                function Await-Operation($operation, $resultType) {
                    $task = $operationMethod.MakeGenericMethod($resultType).Invoke($null, @($operation));
                    $task.Wait();
                    return $task.Result;
                }
                function Encode($value) {
                    if ([string]::IsNullOrEmpty([string]$value)) { return '-' }
                    return [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes([string]$value));
                }
                function Read-Status($sessions, $pattern, $propertiesType) {
                    $session = $sessions | Where-Object { $_.SourceAppUserModelId -match $pattern } | Select-Object -First 1;
                    if ($null -eq $session) { return @('-', '-', 'false', 'false') }
                    $properties = Await-Operation ($session.TryGetMediaPropertiesAsync()) $propertiesType;
                    $playing = $session.GetPlaybackInfo().PlaybackStatus.ToString() -eq 'Playing';
                    return @((Encode $properties.Title), (Encode $properties.Artist), $playing.ToString().ToLowerInvariant(), 'true');
                }
                $managerType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime];
                $propertiesType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType=WindowsRuntime];
                $manager = Await-Operation ($managerType::RequestAsync()) $managerType;
                $previous = '';
                while ($true) {
                    try {
                        $sessions = $manager.GetSessions();
                        $spotify = Read-Status $sessions 'Spotify|Chrome' $propertiesType;
                        $youtube = Read-Status $sessions 'YouTube|MSEdge' $propertiesType;
                        $line = (@($spotify) + @($youtube)) -join '|';
                        if ($line -ne $previous) {
                            [Console]::WriteLine($line);
                            [Console]::Out.Flush();
                            $previous = $line;
                        }
                    } catch {}
                    Start-Sleep -Milliseconds 750;
                }
                """;
        String encodedScript = Base64.getEncoder().encodeToString(
                script.getBytes(StandardCharsets.UTF_16LE)
        );
        monitorProcess = new ProcessBuilder(
                "powershell.exe",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-EncodedCommand",
                encodedScript
        ).start();

        Thread.ofVirtual().name("media-status-monitor").start(this::readMonitorOutput);
    }

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(error -> emitters.remove(emitter));
        send(emitter, currentStatuses);
        return emitter;
    }

    @PreDestroy
    public void stop() {
        if (monitorProcess != null) {
            monitorProcess.destroy();
        }
    }

    private void readMonitorOutput() {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(monitorProcess.getInputStream(), StandardCharsets.UTF_8)
        )) {
            String line;

            while ((line = reader.readLine()) != null) {
                try {
                    MediaStatuses statuses = parseStatuses(line);
                    currentStatuses = statuses;
                    emitters.forEach(emitter -> send(emitter, statuses));
                } catch (IOException | IllegalArgumentException ignored) {
                    // Ignore one malformed update and continue monitoring.
                }
            }
        } catch (IOException ignored) {
            // The monitor ends when the backend shuts down.
        }
    }

    private MediaStatuses parseStatuses(String line) throws IOException {
        String[] values = line.split("\\|", -1);

        if (values.length != 8) {
            throw new IOException("Media statuses could not be parsed");
        }

        return new MediaStatuses(parseStatus(values, 0), parseStatus(values, 4));
    }

    private MediaStatus parseStatus(String[] values, int offset) {
        return new MediaStatus(
                decodeBase64(values[offset]),
                decodeBase64(values[offset + 1]),
                Boolean.parseBoolean(values[offset + 2]),
                Boolean.parseBoolean(values[offset + 3])
        );
    }

    private String decodeBase64(String value) {
        if (value.isBlank() || value.equals("-")) {
            return "";
        }

        return new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
    }

    private void send(SseEmitter emitter, MediaStatuses statuses) {
        try {
            emitter.send(SseEmitter.event().name("media-status").data(statuses));
        } catch (IOException | IllegalStateException exception) {
            emitters.remove(emitter);
            try {
                emitter.complete();
            } catch (IllegalStateException ignored) {
                // The connection is already closed.
            }
        }
    }
}
