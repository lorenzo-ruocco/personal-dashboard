package com.lorenzo.dashboard.model;

public record MarketIndexPerformance(
        String id,
        String name,
        String flag,
        String regionCode,
        String symbol,
        Double value,
        Double change,
        Double changePercent,
        String currency,
        Long asOf,
        String status
) {
}
