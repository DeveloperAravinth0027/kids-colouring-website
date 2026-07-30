package com.kidscolour;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableCaching // catalogue reads are cached; see BookServiceImpl / CategoryServiceImpl
public class KidsColourApplication {

    public static void main(String[] args) {
        SpringApplication.run(KidsColourApplication.class, args);
    }

}
