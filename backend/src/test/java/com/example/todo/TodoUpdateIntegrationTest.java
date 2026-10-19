package com.example.todo;

import com.example.todo.entity.Todo;
import com.example.todo.repository.TodoRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class TodoUpdateIntegrationTest {

    @Autowired
    private TodoRepository todoRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @Transactional
    void shouldUpdateTodoUsingDirtyChecking() {
        Todo todo = new Todo();
        todo.setTitle("Spring Data JPA öğreniyorum");
        todo.setCompleted(false);

        Todo savedTodo = todoRepository.save(todo);
        Long id = savedTodo.getId();

        assertNotNull(id);

        entityManager.flush();
        entityManager.clear();

        Todo foundTodo = todoRepository.findById(id).orElseThrow();
        foundTodo.setCompleted(true);

        entityManager.flush();
        entityManager.clear();

        Todo updatedTodo = todoRepository.findById(id).orElseThrow();

        assertTrue(updatedTodo.isCompleted());
        assertEquals("Spring Data JPA öğreniyorum", updatedTodo.getTitle());
    }
}
