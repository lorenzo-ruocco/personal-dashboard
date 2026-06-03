package com.lorenzo.dashboard.controller;

import com.lorenzo.dashboard.model.OpenTargetRequest;
import com.lorenzo.dashboard.service.OpenTargetService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/open-target")
public class OpenTargetController {

    private final OpenTargetService openTargetService;

    public OpenTargetController(OpenTargetService openTargetService) {
        this.openTargetService = openTargetService;
    }

    @PostMapping
    public ResponseEntity<String> openTarget(@RequestBody OpenTargetRequest request) {
        try {
            openTargetService.openTarget(request.getTarget());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(exception.getMessage());
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Target could not be opened");
        }
    }
}
