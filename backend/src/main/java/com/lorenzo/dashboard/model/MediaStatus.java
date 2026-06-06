package com.lorenzo.dashboard.model;

public record MediaStatus(
        String title,
        String artist,
        boolean playing,
        boolean available
) {
}
