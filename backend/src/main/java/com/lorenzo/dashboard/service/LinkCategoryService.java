package com.lorenzo.dashboard.service;

import com.lorenzo.dashboard.model.LinkCategory;
import com.lorenzo.dashboard.repository.LinkCategoryRepository;
import com.lorenzo.dashboard.repository.LinkTileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LinkCategoryService {

    private final LinkCategoryRepository linkCategoryRepository;
    private final LinkTileRepository linkTileRepository;

    public LinkCategoryService(
            LinkCategoryRepository linkCategoryRepository,
            LinkTileRepository linkTileRepository
    ) {
        this.linkCategoryRepository = linkCategoryRepository;
        this.linkTileRepository = linkTileRepository;
    }

    public List<LinkCategory> getAllLinkCategories() {
        return linkCategoryRepository.findAllByOrderBySortOrderAscIdAsc();
    }

    public LinkCategory getLinkCategoryById(Long id) {
        return linkCategoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Link category not found with id: " + id));
    }

    public LinkCategory createLinkCategory(LinkCategory linkCategory) {
        return linkCategoryRepository.save(linkCategory);
    }

    public LinkCategory updateLinkCategory(Long id, LinkCategory updatedLinkCategory) {
        LinkCategory linkCategory = getLinkCategoryById(id);

        linkCategory.setName(updatedLinkCategory.getName());
        linkCategory.setSortOrder(updatedLinkCategory.getSortOrder());

        return linkCategoryRepository.save(linkCategory);
    }

    @Transactional
    public void deleteLinkCategory(Long id) {
        LinkCategory linkCategory = getLinkCategoryById(id);
        linkTileRepository.deleteByCategoryId(id);
        linkCategoryRepository.delete(linkCategory);
    }
}
