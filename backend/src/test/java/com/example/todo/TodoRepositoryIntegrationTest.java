package com.example.todo;

import com.example.todo.entity.Todo;
import com.example.todo.repository.TodoRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class TodoRepositoryIntegrationTest {

    @Autowired
    private TodoRepository todoRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @Transactional
    void shouldSaveAndFindTodoById() {
        Todo todo = new Todo();
        todo.setTitle("Spring Data JPA öğreniyorum");
        todo.setCompleted(false);

        Todo savedTodo = todoRepository.save(todo);

        assertNotNull(savedTodo.getId());

        entityManager.flush();
        entityManager.clear();

        Optional<Todo> foundTodo = todoRepository.findById(savedTodo.getId());

        assertTrue(foundTodo.isPresent());
        assertEquals("Spring Data JPA öğreniyorum", foundTodo.get().getTitle());
        assertFalse(foundTodo.get().isCompleted());
    }
}
