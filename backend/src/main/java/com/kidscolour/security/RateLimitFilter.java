package com.kidscolour.security;

import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Throttles requests per client IP before they reach any controller.
 *
 * Login/register get a deliberately tight budget: without this, an attacker can
 * try passwords as fast as the network allows, which is how weak credentials
 * actually get broken in practice.
 */
@Slf4j
@Component
@Order(1) // run before authentication
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;

    private static final String[] AUTH_PATHS = {
            "/api/auth/login", "/api/auth/register",
            "/api/auth/forgot-password", "/api/auth/reset-password",
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        boolean isAuth = false;
        for (String p : AUTH_PATHS) {
            if (path.startsWith(p)) { isAuth = true; break; }
        }

        // Only throttle state-changing auth calls and API traffic; let static
        // assets and page-image reads through untouched.
        if (!isAuth && !path.startsWith("/api/")) {
            chain.doFilter(request, response);
            return;
        }

        String ip = clientIp(request);
        Bucket bucket = isAuth ? rateLimitService.forAuth(ip) : rateLimitService.forApi(ip);

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
            return;
        }

        if (isAuth) log.warn("Rate limit hit on {} from {}", path, ip);
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", "60");
        response.getWriter().write(
                "{\"success\":false,\"message\":\"Too many requests. Please wait a minute and try again.\",\"data\":null}");
    }

    /** Honour proxy headers so limits work behind a load balancer / CDN. */
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String real = request.getHeader("X-Real-IP");
        return (real != null && !real.isBlank()) ? real : request.getRemoteAddr();
    }
}
