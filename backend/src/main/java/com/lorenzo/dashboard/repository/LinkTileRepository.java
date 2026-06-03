package com.lorenzo.dashboard.repository;

import com.lorenzo.dashboard.model.LinkTile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LinkTileRepository extends JpaRepository<LinkTile, Long> {
    List<LinkTile> findAllByOrderBySortOrderAscIdAsc();

    void deleteByCategoryId(Long categoryId);
}
