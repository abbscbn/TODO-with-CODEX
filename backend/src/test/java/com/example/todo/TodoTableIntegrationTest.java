package com.example.todo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class TodoTableIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void todoTableShouldExistInPublicSchema() {
        Integer tableCount = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = 'PUBLIC'
                  AND TABLE_NAME = 'T_TODO'
                """,
                Integer.class);

        assertEquals(Integer.valueOf(1), tableCount);
    }
}
