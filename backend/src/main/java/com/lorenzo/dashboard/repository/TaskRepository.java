package com.lorenzo.dashboard.repository;

import com.lorenzo.dashboard.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
}
