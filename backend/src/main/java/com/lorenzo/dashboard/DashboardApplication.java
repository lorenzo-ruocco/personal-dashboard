package com.lorenzo.dashboard;

import com.lorenzo.dashboard.service.TaskService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class DashboardApplication {

	public static void main(String[] args) {
		SpringApplication.run(DashboardApplication.class, args);
	}

	@Bean
	ApplicationRunner cleanupCompletedTasksOnStartup(TaskService taskService) {
		return args -> taskService.deleteCompletedTasks();
	}

}
