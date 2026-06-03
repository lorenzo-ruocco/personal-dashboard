package com.lorenzo.dashboard.service;

import com.lorenzo.dashboard.model.LinkTile;
import com.lorenzo.dashboard.repository.LinkTileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LinkTileService {

    private final LinkTileRepository linkTileRepository;

    public LinkTileService(LinkTileRepository linkTileRepository) {
        this.linkTileRepository = linkTileRepository;
    }

    public List<LinkTile> getAllLinkTiles() {
        return linkTileRepository.findAllByOrderBySortOrderAscIdAsc();
    }

    public LinkTile getLinkTileById(Long id) {
        return linkTileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Link tile not found with id: " + id));
    }

    public LinkTile createLinkTile(LinkTile linkTile) {
        return linkTileRepository.save(linkTile);
    }

    public LinkTile updateLinkTile(Long id, LinkTile updatedLinkTile) {
        LinkTile linkTile = getLinkTileById(id);

        linkTile.setCategoryId(updatedLinkTile.getCategoryId());
        linkTile.setTitle(updatedLinkTile.getTitle());
        linkTile.setTarget(updatedLinkTile.getTarget());
        linkTile.setSortOrder(updatedLinkTile.getSortOrder());

        return linkTileRepository.save(linkTile);
    }

    public void deleteLinkTile(Long id) {
        LinkTile linkTile = getLinkTileById(id);
        linkTileRepository.delete(linkTile);
    }
}
