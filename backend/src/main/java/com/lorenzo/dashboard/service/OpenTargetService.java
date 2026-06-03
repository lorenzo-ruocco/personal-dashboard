package com.lorenzo.dashboard.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Paths;

@Service
public class OpenTargetService {

    public void openTarget(String target) throws IOException {
        String normalizedTarget = normalizeTarget(target);

        if (normalizedTarget.isBlank()) {
            throw new IllegalArgumentException("Target must not be empty");
        }

        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", normalizedTarget).start();
            return;
        }

        new ProcessBuilder("xdg-open", normalizedTarget).start();
    }

    private String normalizeTarget(String target) {
        String normalizedTarget = target == null ? "" : target.trim();

        if (!normalizedTarget.toLowerCase().startsWith("file:")) {
            return normalizedTarget;
        }

        try {
            return Paths.get(new URI(normalizedTarget)).toString();
        } catch (IllegalArgumentException | URISyntaxException exception) {
            return normalizedTarget;
        }
    }
}
