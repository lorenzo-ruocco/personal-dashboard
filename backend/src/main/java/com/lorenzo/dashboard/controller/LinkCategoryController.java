package com.lorenzo.dashboard.controller;

import com.lorenzo.dashboard.model.LinkCategory;
import com.lorenzo.dashboard.service.LinkCategoryService;
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
@RequestMapping("/api/link-categories")
public class LinkCategoryController {

    private final LinkCategoryService linkCategoryService;

    public LinkCategoryController(LinkCategoryService linkCategoryService) {
        this.linkCategoryService = linkCategoryService;
    }

    @GetMapping
    public List<LinkCategory> getAllLinkCategories() {
        return linkCategoryService.getAllLinkCategories();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LinkCategory createLinkCategory(@RequestBody LinkCategory linkCategory) {
        return linkCategoryService.createLinkCategory(linkCategory);
    }

    @PutMapping("/{id}")
    public LinkCategory updateLinkCategory(@PathVariable Long id, @RequestBody LinkCategory linkCategory) {
        return linkCategoryService.updateLinkCategory(id, linkCategory);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLinkCategory(@PathVariable Long id) {
        linkCategoryService.deleteLinkCategory(id);
    }
}
