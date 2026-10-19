package com.example.todo.service;

import java.util.List;

import com.example.todo.dto.TodoRequest;
import com.example.todo.dto.TodoResponse;
import com.example.todo.entity.Todo;
import com.example.todo.exception.TodoNotFoundException;
import com.example.todo.repository.TodoRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TodoService {
    private final TodoRepository todoRepository;

    public TodoService(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    public List<TodoResponse> findAll() {
        return todoRepository.findAll(Sort.by("id")).stream().map(TodoResponse::from).toList();
    }

    public TodoResponse findById(Long id) {
        return TodoResponse.from(requireTodo(id));
    }

    @Transactional
    public TodoResponse create(TodoRequest request) {
        Todo todo = new Todo();
        todo.setTitle(request.title());
        todo.setCompleted(request.completed());
        return TodoResponse.from(todoRepository.save(todo));
    }

    @Transactional
    public TodoResponse update(Long id, TodoRequest request) {
        Todo todo = requireTodo(id);
        todo.setTitle(request.title());
        todo.setCompleted(request.completed());
        return TodoResponse.from(todo);
    }

    @Transactional
    public TodoResponse toggle(Long id) {
        Todo todo = requireTodo(id);
        todo.setCompleted(!todo.isCompleted());
        return TodoResponse.from(todo);
    }

    @Transactional
    public void delete(Long id) {
        todoRepository.delete(requireTodo(id));
    }

    private Todo requireTodo(Long id) {
        return todoRepository.findById(id).orElseThrow(() -> new TodoNotFoundException(id));
    }
}
