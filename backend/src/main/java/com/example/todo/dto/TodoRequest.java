package com.example.todo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TodoRequest(
        @NotBlank(message = "Başlık boş olamaz.")
        @Size(max = 200, message = "Başlık en fazla 200 karakter olabilir.")
        String title,
        Boolean completed) {
    public TodoRequest {
        completed = Boolean.TRUE.equals(completed);
    }
}
