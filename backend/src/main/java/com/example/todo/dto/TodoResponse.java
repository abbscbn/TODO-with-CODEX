package com.example.todo.dto;

import com.example.todo.entity.Todo;

public record TodoResponse(Long id, String title, boolean completed) {
    public static TodoResponse from(Todo todo) {
        return new TodoResponse(todo.getId(), todo.getTitle(), todo.isCompleted());
    }
}
