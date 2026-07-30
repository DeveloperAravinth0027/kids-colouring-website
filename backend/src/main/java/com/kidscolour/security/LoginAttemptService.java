package com.kidscolour.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Temporarily locks an account after repeated failed logins.
 *
 * IP rate limiting alone isn't enough — an attacker with many IPs (a botnet, or
 * just a proxy pool) can spread guesses thinly and stay under the per-IP limit.
 * Counting failures per ACCOUNT closes that hole. The lock is time-based rather
 * than permanent so a real customer isn't locked out for good by someone else's
 * guessing.
 */
@Slf4j
@Service
public class LoginAttemptService {

    private static final int MAX_FAILURES = 8;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final Cache<String, AtomicInteger> failures = Caffeine.newBuilder()
            .maximumSize(100_000)
            .expireAfterWrite(LOCK_DURATION)
            .build();

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    public void recordFailure(String email) {
        int count = failures.get(key(email), k -> new AtomicInteger()).incrementAndGet();
        if (count == MAX_FAILURES) {
            log.warn("Account {} locked for {} minutes after {} failed logins",
                    key(email), LOCK_DURATION.toMinutes(), count);
        }
    }

    public void reset(String email) {
        failures.invalidate(key(email));
    }

    public boolean isLocked(String email) {
        AtomicInteger c = failures.getIfPresent(key(email));
        return c != null && c.get() >= MAX_FAILURES;
    }

    public long lockMinutes() {
        return LOCK_DURATION.toMinutes();
    }
}
