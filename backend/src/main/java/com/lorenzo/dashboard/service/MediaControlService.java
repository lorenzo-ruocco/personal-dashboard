package com.lorenzo.dashboard.service;

import com.lorenzo.dashboard.model.MediaStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Locale;

@Service
public class MediaControlService {

    private static final int KEYEVENTF_KEYUP = 0x0002;

    public void sendMediaCommand(String action) throws IOException {
        int virtualKey = getVirtualKey(action);
        String osName = System.getProperty("os.name").toLowerCase(Locale.ROOT);

        if (!osName.contains("win")) {
            throw new IOException("Media controls are only supported on Windows");
        }

        String command = """
                Add-Type -Namespace Native -Name Keyboard -MemberDefinition '[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);';
                [Native.Keyboard]::keybd_event(%d, 0, 0, [UIntPtr]::Zero);
                [Native.Keyboard]::keybd_event(%d, 0, %d, [UIntPtr]::Zero);
                """.formatted(virtualKey, virtualKey, KEYEVENTF_KEYUP);
        String encodedCommand = Base64.getEncoder().encodeToString(
                command.getBytes(StandardCharsets.UTF_16LE)
        );

        runPowerShell(encodedCommand);
    }

    public MediaStatus getMediaStatus() throws IOException {
        ensureWindows();

        String command = """
                Add-Type -AssemblyName System.Runtime.WindowsRuntime;
                $operationMethod = [System.WindowsRuntimeSystemExtensions].GetMethods() |
                    Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } |
                    Select-Object -First 1;
                function Await-Operation($operation, $resultType) {
                    $task = $operationMethod.MakeGenericMethod($resultType).Invoke($null, @($operation));
                    $task.Wait();
                    return $task.Result;
                }
                $managerType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime];
                $propertiesType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType=WindowsRuntime];
                $manager = Await-Operation ($managerType::RequestAsync()) $managerType;
                $session = $manager.GetCurrentSession();
                if ($null -eq $session) {
                    '-';
                    '-';
                    'false';
                    'false';
                    exit 0;
                }
                $properties = Await-Operation ($session.TryGetMediaPropertiesAsync()) $propertiesType;
                $playing = $session.GetPlaybackInfo().PlaybackStatus.ToString() -eq 'Playing';
                [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes([string]$properties.Title));
                [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes([string]$properties.Artist));
                $playing.ToString().ToLowerInvariant();
                'true';
                """;
        String output = runPowerShell(encodePowerShellCommand(command));
        String[] values = output.strip().split("\\R", -1);

        if (values.length < 4) {
            throw new IOException("Media status could not be parsed: " + output);
        }

        return new MediaStatus(
                decodeBase64(values[0]),
                decodeBase64(values[1]),
                Boolean.parseBoolean(values[2]),
                Boolean.parseBoolean(values[3])
        );
    }

    private String runPowerShell(String encodedCommand) throws IOException {
        Process process = new ProcessBuilder(
                "powershell.exe",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-EncodedCommand",
                encodedCommand
        ).start();

        try {
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            String errorOutput = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new IOException("Media command failed with exit code " + exitCode + ": " + errorOutput);
            }

            return output;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IOException("Media command was interrupted", exception);
        }
    }

    private String encodePowerShellCommand(String command) {
        return Base64.getEncoder().encodeToString(command.getBytes(StandardCharsets.UTF_16LE));
    }

    private String decodeBase64(String value) {
        if (value.isBlank() || value.trim().equals("-")) {
            return "";
        }

        return new String(Base64.getDecoder().decode(value.trim()), StandardCharsets.UTF_8);
    }

    private void ensureWindows() throws IOException {
        String osName = System.getProperty("os.name").toLowerCase(Locale.ROOT);

        if (!osName.contains("win")) {
            throw new IOException("Media controls are only supported on Windows");
        }
    }

    private int getVirtualKey(String action) {
        String normalizedAction = action == null
                ? ""
                : action.trim().toLowerCase(Locale.ROOT);

        return switch (normalizedAction) {
            case "previous" -> 0xB1;
            case "play-pause" -> 0xB3;
            case "next" -> 0xB0;
            default -> throw new IllegalArgumentException("Unsupported media action");
        };
    }
}
