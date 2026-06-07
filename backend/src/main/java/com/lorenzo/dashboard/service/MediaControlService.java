package com.lorenzo.dashboard.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Locale;

@Service
public class MediaControlService {

    public void sendMediaCommand(String provider, String action) throws IOException {
        ensureWindows();
        String sourcePattern = getSourcePattern(provider);
        String operation = getSessionOperation(action);
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
                $manager = Await-Operation ($managerType::RequestAsync()) $managerType;
                $session = $manager.GetSessions() | Where-Object { $_.SourceAppUserModelId -match '%s' } | Select-Object -First 1;
                if ($null -eq $session) { exit 2; }
                Await-Operation ($session.%s()) ([bool]) | Out-Null;
                """.formatted(sourcePattern, operation);

        runPowerShell(encodePowerShellCommand(command));
    }

    public void openMediaWindow(String provider) throws IOException {
        ensureWindows();
        String normalizedProvider = normalizeProvider(provider);

        if (!"youtube".equals(normalizedProvider) && !"whatsapp".equals(normalizedProvider)) {
            throw new IllegalArgumentException("Unsupported media provider");
        }

        String executable = "youtube".equals(normalizedProvider) ? "msedge.exe" : "chrome.exe";
        String url = "youtube".equals(normalizedProvider)
                ? "https://www.youtube.com/"
                : "https://web.whatsapp.com/";
        String command = """
                Add-Type -AssemblyName System.Windows.Forms;
                $area = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea;
                $width = [Math]::Round($area.Width * 0.62);
                Start-Process %s -ArgumentList @(
                    '--app=%s',
                    '--new-window',
                    "--window-size=$width,$($area.Height)",
                    "--window-position=$($area.Left),$($area.Top)"
                );
                """.formatted(executable, url);

        runPowerShell(encodePowerShellCommand(command));
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

    private void ensureWindows() throws IOException {
        String osName = System.getProperty("os.name").toLowerCase(Locale.ROOT);

        if (!osName.contains("win")) {
            throw new IOException("Media controls are only supported on Windows");
        }
    }

    private String getSessionOperation(String action) {
        String normalizedAction = action == null
                ? ""
                : action.trim().toLowerCase(Locale.ROOT);

        return switch (normalizedAction) {
            case "previous" -> "TrySkipPreviousAsync";
            case "play-pause" -> "TryTogglePlayPauseAsync";
            case "next" -> "TrySkipNextAsync";
            default -> throw new IllegalArgumentException("Unsupported media action");
        };
    }

    private String getSourcePattern(String provider) {
        return switch (normalizeProvider(provider)) {
            case "spotify" -> "Spotify|Chrome";
            case "youtube" -> "YouTube|MSEdge";
            default -> throw new IllegalArgumentException("Unsupported media provider");
        };
    }

    private String normalizeProvider(String provider) {
        return provider == null ? "" : provider.trim().toLowerCase(Locale.ROOT);
    }
}
