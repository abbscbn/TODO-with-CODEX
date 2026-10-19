package com.example.todo.controller;

import com.example.todo.entity.Todo;
import com.example.todo.repository.TodoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TodoControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TodoRepository todoRepository;

    @BeforeEach
    void cleanDatabase() {
        todoRepository.deleteAll();
    }

    @Test
    void shouldListTodos() throws Exception {
        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
        Todo todo = createTodo();
        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(todo.getId()))
                .andExpect(jsonPath("$[0].title").value("İlk görev"))
                .andExpect(jsonPath("$[0].completed").value(false));
    }

    @Test
    void shouldCreateTodo() throws Exception {
        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Yeni görev","completed":false}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("Yeni görev"))
                .andExpect(jsonPath("$.completed").value(false));
        assertTrue(todoRepository.findAll().stream()
                .anyMatch(todo -> todo.getTitle().equals("Yeni görev")));
    }

    @Test
    void shouldGetTodoById() throws Exception {
        Todo todo = createTodo();
        mockMvc.perform(get("/api/todos/{id}", todo.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(todo.getId()))
                .andExpect(jsonPath("$.title").value("İlk görev"));
    }

    @Test
    void shouldUpdateTodo() throws Exception {
        Todo todo = createTodo();
        mockMvc.perform(put("/api/todos/{id}", todo.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Güncel görev","completed":true}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Güncel görev"))
                .andExpect(jsonPath("$.completed").value(true));
        mockMvc.perform(get("/api/todos/{id}", todo.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Güncel görev"))
                .andExpect(jsonPath("$.completed").value(true));
    }

    @Test
    void shouldToggleTodoBothWays() throws Exception {
        Todo todo = createTodo();
        for (boolean expected : new boolean[]{true, false}) {
            mockMvc.perform(patch("/api/todos/{id}/toggle", todo.getId()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.completed").value(expected))
                    .andExpect(jsonPath("$.title").value("İlk görev"));
            mockMvc.perform(get("/api/todos/{id}", todo.getId()))
                    .andExpect(jsonPath("$.completed").value(expected));
        }
    }

    @Test
    void shouldDeleteTodo() throws Exception {
        Todo todo = createTodo();
        mockMvc.perform(delete("/api/todos/{id}", todo.getId()))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));
        assertFalse(todoRepository.existsById(todo.getId()));
        mockMvc.perform(get("/api/todos/{id}", todo.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnNotFoundForMissingTodo() throws Exception {
        mockMvc.perform(get("/api/todos/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").isString());
        mockMvc.perform(put("/api/todos/999999").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Görev\",\"completed\":true}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/api/todos/999999/toggle"))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/todos/999999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectInvalidTitles() throws Exception {
        Todo todo = createTodo();
        for (String title : new String[]{"", "   ", "a".repeat(201)}) {
            String body = "{\"title\":\"" + title + "\",\"completed\":false}";
            mockMvc.perform(post("/api/todos").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.title").isString());
            mockMvc.perform(put("/api/todos/{id}", todo.getId())
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        mockMvc.perform(post("/api/todos").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").isString());
    }

    @Test
    void shouldAcceptMaximumTitleLength() throws Exception {
        mockMvc.perform(post("/api/todos").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + "a".repeat(200) + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.completed").value(false));
    }

    @Test
    void shouldReturnJsonForMalformedRequests() throws Exception {
        mockMvc.perform(post("/api/todos").contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        mockMvc.perform(get("/api/todos/not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void shouldAllowViteCorsPreflight() throws Exception {
        mockMvc.perform(options("/api/todos/1")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "PUT")
                        .header("Access-Control-Request-Headers", "Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    private Todo createTodo() {
        Todo todo = new Todo();
        todo.setTitle("İlk görev");
        todo.setCompleted(false);
        return todoRepository.save(todo);
    }
}
