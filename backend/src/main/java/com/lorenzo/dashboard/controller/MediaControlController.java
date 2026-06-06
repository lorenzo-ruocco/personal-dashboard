package com.lorenzo.dashboard.controller;

import com.lorenzo.dashboard.model.MediaControlRequest;
import com.lorenzo.dashboard.model.MediaStatus;
import com.lorenzo.dashboard.service.MediaControlService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/media-control")
public class MediaControlController {

    private final MediaControlService mediaControlService;

    public MediaControlController(MediaControlService mediaControlService) {
        this.mediaControlService = mediaControlService;
    }

    @GetMapping("/status")
    public ResponseEntity<MediaStatus> getMediaStatus() {
        try {
            return ResponseEntity.ok(mediaControlService.getMediaStatus());
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<String> controlMedia(@RequestBody MediaControlRequest request) {
        try {
            mediaControlService.sendMediaCommand(request.getAction());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(exception.getMessage());
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Media command could not be sent");
        }
    }
}
