package com.lorenzo.dashboard.service;

import com.lorenzo.dashboard.model.MarketIndexPerformance;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

@Service
public class MarketIndexService {

    private static final List<MarketIndexDefinition> MARKET_INDICES = List.of(
            new MarketIndexDefinition("smi", "SMI", "\uD83C\uDDE8\uD83C\uDDED", "CH", "^SSMI"),
            new MarketIndexDefinition("dax", "DAX", "\uD83C\uDDE9\uD83C\uDDEA", "DE", "^GDAXI"),
            new MarketIndexDefinition("ftse-mib", "FTSE MIB", "\uD83C\uDDEE\uD83C\uDDF9", "IT", "FTSEMIB.MI"),
            new MarketIndexDefinition("euro-stoxx-50", "Euro Stoxx 50", "\uD83C\uDDEA\uD83C\uDDFA", "EU", "^STOXX50E"),
            new MarketIndexDefinition("ftse-100", "FTSE 100", "\uD83C\uDDEC\uD83C\uDDE7", "UK", "^FTSE"),
            new MarketIndexDefinition("nikkei-225", "Nikkei 225", "\uD83C\uDDEF\uD83C\uDDF5", "JP", "^N225"),
            new MarketIndexDefinition("sp-500", "S&P 500", "\uD83C\uDDFA\uD83C\uDDF8", "US", "^GSPC"),
            new MarketIndexDefinition("nasdaq-100", "Nasdaq 100", "\uD83C\uDDFA\uD83C\uDDF8", "US", "^NDX"),
            new MarketIndexDefinition("dow-jones", "Dow Jones", "\uD83C\uDDFA\uD83C\uDDF8", "US", "^DJI")
    );

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public MarketIndexService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6))
                .build();
    }

    public List<MarketIndexPerformance> getMarketIndexPerformances() {
        return MARKET_INDICES.stream()
                .map(this::getMarketIndexPerformance)
                .toList();
    }

    private MarketIndexPerformance getMarketIndexPerformance(MarketIndexDefinition indexDefinition) {
        try {
            JsonNode meta = fetchChartMeta(indexDefinition.symbol());
            double value = meta.path("regularMarketPrice").asDouble(Double.NaN);
            double previousClose = meta.path("chartPreviousClose").asDouble(Double.NaN);

            if (!Double.isFinite(value) || !Double.isFinite(previousClose) || previousClose == 0) {
                return unavailableIndex(indexDefinition);
            }

            double change = value - previousClose;
            double changePercent = change / previousClose * 100;

            return new MarketIndexPerformance(
                    indexDefinition.id(),
                    indexDefinition.name(),
                    indexDefinition.flag(),
                    indexDefinition.regionCode(),
                    indexDefinition.symbol(),
                    value,
                    change,
                    changePercent,
                    meta.path("currency").asText(""),
                    meta.path("regularMarketTime").asLong(0),
                    "ok"
            );
        } catch (IOException | InterruptedException exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }

            return unavailableIndex(indexDefinition);
        }
    }

    private JsonNode fetchChartMeta(String symbol) throws IOException, InterruptedException {
        String encodedSymbol = URLEncoder.encode(symbol, StandardCharsets.UTF_8).replace("+", "%20");
        URI uri = URI.create(
                "https://query1.finance.yahoo.com/v8/finance/chart/"
                        + encodedSymbol
                        + "?range=1d&interval=1d"
        );
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(10))
                .header("User-Agent", "personal-dashboard")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("Market data request failed with status " + response.statusCode());
        }

        JsonNode result = objectMapper.readTree(response.body())
                .path("chart")
                .path("result")
                .path(0);

        if (result.isMissingNode()) {
            throw new IOException("Market data response does not contain chart result");
        }

        return result.path("meta");
    }

    private MarketIndexPerformance unavailableIndex(MarketIndexDefinition indexDefinition) {
        return new MarketIndexPerformance(
                indexDefinition.id(),
                indexDefinition.name(),
                indexDefinition.flag(),
                indexDefinition.regionCode(),
                indexDefinition.symbol(),
                null,
                null,
                null,
                "",
                null,
                "unavailable"
        );
    }

    private record MarketIndexDefinition(String id, String name, String flag, String regionCode, String symbol) {
    }
}
