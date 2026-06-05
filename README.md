# Personal Dashboard

A local dashboard application for organizing everyday information in one place. It combines quick task management, sticky notes, useful links, weather information, and market index data in a single browser-based interface.

## Features

- Task list for tracking personal todos
- Sticky notes for short reminders
- Link collection with categories and favicon support
- Weather and market index overview
- Local persistence through an embedded H2 database
- React frontend served by a Spring Boot backend

## Tech Stack

- Frontend: React and Vite
- Backend: Java 21 and Spring Boot
- Database: H2
- Build tools: npm and Maven Wrapper

## Running Locally

Build the frontend:

```cmd
cd frontend
npm install
npm run build
```

Start the backend:

```cmd
cd backend
mvnw.cmd spring-boot:run
```

Open the application at:

```text
http://localhost:8080/
```
