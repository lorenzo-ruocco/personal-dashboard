package com.lorenzo.dashboard.controller;

import com.lorenzo.dashboard.model.OpenTargetRequest;
import com.lorenzo.dashboard.service.OpenTargetService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
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
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void openTarget(@RequestBody OpenTargetRequest request) throws IOException {
        openTargetService.openTarget(request.getTarget());
    }
}
