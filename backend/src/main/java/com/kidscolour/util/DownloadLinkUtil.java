package com.kidscolour.util;

import java.util.UUID;

public class DownloadLinkUtil {

    public static String generateToken() {
        return UUID.randomUUID().toString() + "-" + System.currentTimeMillis();
    }
}
