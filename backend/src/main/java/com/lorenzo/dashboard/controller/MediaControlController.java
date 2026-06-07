package com.lorenzo.dashboard.controller;

import com.lorenzo.dashboard.model.MediaControlRequest;
import com.lorenzo.dashboard.service.MediaControlService;
import com.lorenzo.dashboard.service.MediaStatusMonitorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@RestController
@RequestMapping("/api/media-control")
public class MediaControlController {

    private final MediaControlService mediaControlService;
    private final MediaStatusMonitorService mediaStatusMonitorService;

    public MediaControlController(
            MediaControlService mediaControlService,
            MediaStatusMonitorService mediaStatusMonitorService
    ) {
        this.mediaControlService = mediaControlService;
        this.mediaStatusMonitorService = mediaStatusMonitorService;
    }

    @GetMapping("/status-stream")
    public SseEmitter streamMediaStatus() {
        return mediaStatusMonitorService.subscribe();
    }

    @PostMapping("/open/{provider}")
    public ResponseEntity<String> openMediaWindow(@PathVariable String provider) {
        try {
            mediaControlService.openMediaWindow(provider);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(exception.getMessage());
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Media window could not be opened");
        }
    }

    @PostMapping
    public ResponseEntity<String> controlMedia(@RequestBody MediaControlRequest request) {
        try {
            mediaControlService.sendMediaCommand(request.getProvider(), request.getAction());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(exception.getMessage());
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Media command could not be sent");
        }
    }
}
