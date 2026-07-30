package com.kidscolour.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class DownloadException extends RuntimeException {
    public DownloadException(String message) {
        super(message);
    }
}
