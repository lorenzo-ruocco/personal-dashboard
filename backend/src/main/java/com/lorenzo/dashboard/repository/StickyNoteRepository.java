package com.lorenzo.dashboard.repository;

import com.lorenzo.dashboard.model.StickyNote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StickyNoteRepository extends JpaRepository<StickyNote, Long> {
}
