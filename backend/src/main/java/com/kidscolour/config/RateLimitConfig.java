package com.kidscolour.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Value("${app.rate-limit.auth.capacity}")
    private int authCapacity;

    @Value("${app.rate-limit.auth.refill-tokens}")
    private int authRefillTokens;

    @Value("${app.rate-limit.auth.refill-duration-minutes}")
    private int authRefillDurationMinutes;
    
    @Value("${app.rate-limit.api.capacity}")
    private int apiCapacity;

    @Value("${app.rate-limit.api.refill-tokens}")
    private int apiRefillTokens;

    @Value("${app.rate-limit.api.refill-duration-minutes}")
    private int apiRefillDurationMinutes;

    @Bean(name = "authBucket")
    public Bucket authBucket() {
        Bandwidth limit = Bandwidth.classic(authCapacity, Refill.greedy(authRefillTokens, Duration.ofMinutes(authRefillDurationMinutes)));
        return Bucket.builder().addLimit(limit).build();
    }
    
    @Bean(name = "apiBucket")
    public Bucket apiBucket() {
        Bandwidth limit = Bandwidth.classic(apiCapacity, Refill.greedy(apiRefillTokens, Duration.ofMinutes(apiRefillDurationMinutes)));
        return Bucket.builder().addLimit(limit).build();
    }
}
