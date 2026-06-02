package com.lorenzo.dashboard.controller;

import com.lorenzo.dashboard.model.StickyNote;
import com.lorenzo.dashboard.service.StickyNoteService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sticky-notes")
public class StickyNoteController {

    private final StickyNoteService stickyNoteService;

    public StickyNoteController(StickyNoteService stickyNoteService) {
        this.stickyNoteService = stickyNoteService;
    }

    @GetMapping
    public List<StickyNote> getAllStickyNotes() {
        return stickyNoteService.getAllStickyNotes();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StickyNote createStickyNote(@RequestBody StickyNote stickyNote) {
        return stickyNoteService.createStickyNote(stickyNote);
    }

    @PutMapping("/{id}")
    public StickyNote updateStickyNote(@PathVariable Long id, @RequestBody StickyNote stickyNote) {
        return stickyNoteService.updateStickyNote(id, stickyNote);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStickyNote(@PathVariable Long id) {
        stickyNoteService.deleteStickyNote(id);
    }
}
