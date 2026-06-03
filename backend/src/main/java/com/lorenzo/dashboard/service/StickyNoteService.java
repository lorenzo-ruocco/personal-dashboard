package com.lorenzo.dashboard.service;

import com.lorenzo.dashboard.model.StickyNote;
import com.lorenzo.dashboard.repository.StickyNoteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StickyNoteService {

    private final StickyNoteRepository stickyNoteRepository;

    public StickyNoteService(StickyNoteRepository stickyNoteRepository) {
        this.stickyNoteRepository = stickyNoteRepository;
    }

    public List<StickyNote> getAllStickyNotes() {
        return stickyNoteRepository.findAll();
    }

    public StickyNote getStickyNoteById(Long id) {
        return stickyNoteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sticky note not found with id: " + id));
    }

    public StickyNote createStickyNote(StickyNote stickyNote) {
        return stickyNoteRepository.save(stickyNote);
    }

    public StickyNote updateStickyNote(Long id, StickyNote updatedStickyNote) {
        StickyNote stickyNote = getStickyNoteById(id);

        stickyNote.setText(updatedStickyNote.getText());
        stickyNote.setX(updatedStickyNote.getX());
        stickyNote.setY(updatedStickyNote.getY());
        stickyNote.setZIndex(updatedStickyNote.getZIndex());
        stickyNote.setColor(updatedStickyNote.getColor());

        return stickyNoteRepository.save(stickyNote);
    }

    public void deleteStickyNote(Long id) {
        StickyNote stickyNote = getStickyNoteById(id);
        stickyNoteRepository.delete(stickyNote);
    }
}
