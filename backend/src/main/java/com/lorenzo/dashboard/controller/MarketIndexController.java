package com.lorenzo.dashboard.controller;

import com.lorenzo.dashboard.model.MarketIndexPerformance;
import com.lorenzo.dashboard.service.MarketIndexService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/markets")
public class MarketIndexController {

    private final MarketIndexService marketIndexService;

    public MarketIndexController(MarketIndexService marketIndexService) {
        this.marketIndexService = marketIndexService;
    }

    @GetMapping("/indices")
    public List<MarketIndexPerformance> getMarketIndexPerformances() {
        return marketIndexService.getMarketIndexPerformances();
    }
}
