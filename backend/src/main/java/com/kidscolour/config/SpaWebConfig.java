package com.kidscolour.config;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Serves the bundled React single-page app from classpath:/static and falls
 * back to index.html for client-side routes (e.g. /books, /login, /admin) so a
 * direct visit or page refresh doesn't 404. Real files (JS/CSS/images) are
 * served as-is; API and actuator paths are never hijacked (they're handled by
 * their controllers before this resolver ever runs, and guarded here too).
 */
@Component
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws java.io.IOException {
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested; // a real static file (asset, favicon, etc.)
                        }
                        // Don't serve the SPA shell for backend routes.
                        if (resourcePath.startsWith("api/") || resourcePath.startsWith("actuator/")
                                || resourcePath.startsWith("v3/") || resourcePath.startsWith("swagger-ui")) {
                            return null;
                        }
                        // Everything else is a client-side route -> hand back the SPA.
                        Resource index = new ClassPathResource("/static/index.html");
                        return index.exists() ? index : null;
                    }
                });
    }
}
