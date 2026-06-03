package com.lorenzo.dashboard.controller;

import com.lorenzo.dashboard.model.LinkTile;
import com.lorenzo.dashboard.service.LinkTileService;
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
@RequestMapping("/api/link-tiles")
public class LinkTileController {

    private final LinkTileService linkTileService;

    public LinkTileController(LinkTileService linkTileService) {
        this.linkTileService = linkTileService;
    }

    @GetMapping
    public List<LinkTile> getAllLinkTiles() {
        return linkTileService.getAllLinkTiles();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LinkTile createLinkTile(@RequestBody LinkTile linkTile) {
        return linkTileService.createLinkTile(linkTile);
    }

    @PutMapping("/{id}")
    public LinkTile updateLinkTile(@PathVariable Long id, @RequestBody LinkTile linkTile) {
        return linkTileService.updateLinkTile(id, linkTile);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLinkTile(@PathVariable Long id) {
        linkTileService.deleteLinkTile(id);
    }
}
