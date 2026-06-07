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
import org.springframework.web.bind.annotation.PathVariable;

import java.io.IOException;

@RestController
@RequestMapping("/api/media-control")
public class MediaControlController {

    private final MediaControlService mediaControlService;

    public MediaControlController(MediaControlService mediaControlService) {
        this.mediaControlService = mediaControlService;
    }

    @GetMapping("/status/{provider}")
    public ResponseEntity<MediaStatus> getMediaStatus(@PathVariable String provider) {
        try {
            return ResponseEntity.ok(mediaControlService.getMediaStatus(provider));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
