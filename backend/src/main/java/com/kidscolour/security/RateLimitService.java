package com.kidscolour.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Per-caller rate limiting.
 *
 * Buckets are keyed by client IP, never shared globally — a single global
 * bucket would let one attacker exhaust the limit and lock out every other
 * customer (a denial-of-service in itself). The cache is bounded and expires,
 * so a flood of unique IPs can't exhaust memory either.
 */
@Service
public class RateLimitService {

    @Value("${app.rate-limit.auth.capacity:5}")
    private int authCapacity;

    @Value("${app.rate-limit.auth.refill-duration-minutes:1}")
    private int authRefillMinutes;

    @Value("${app.rate-limit.api.capacity:100}")
    private int apiCapacity;

    @Value("${app.rate-limit.api.refill-duration-minutes:1}")
    private int apiRefillMinutes;

    private final Cache<String, Bucket> authBuckets = Caffeine.newBuilder()
            .maximumSize(50_000).expireAfterAccess(Duration.ofMinutes(30)).build();

    private final Cache<String, Bucket> apiBuckets = Caffeine.newBuilder()
            .maximumSize(50_000).expireAfterAccess(Duration.ofMinutes(10)).build();

    /** Strict budget for login/register/password-reset. */
    public Bucket forAuth(String ip) {
        return authBuckets.get(ip, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(authCapacity,
                        Refill.greedy(authCapacity, Duration.ofMinutes(authRefillMinutes))))
                .build());
    }

    /** Looser budget for the rest of the API. */
    public Bucket forApi(String ip) {
        return apiBuckets.get(ip, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(apiCapacity,
                        Refill.greedy(apiCapacity, Duration.ofMinutes(apiRefillMinutes))))
                .build());
    }
}
