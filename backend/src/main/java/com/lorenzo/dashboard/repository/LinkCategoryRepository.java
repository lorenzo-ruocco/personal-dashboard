package com.lorenzo.dashboard.repository;

import com.lorenzo.dashboard.model.LinkCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LinkCategoryRepository extends JpaRepository<LinkCategory, Long> {
    List<LinkCategory> findAllByOrderBySortOrderAscIdAsc();
}
