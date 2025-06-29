# Task Comments API Tests

## Base URL
```
http://localhost:3000/api/task-comments
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 1. Create Task Comment

**POST** `/api/task-comments`

**Payload (ICreateTaskCommentPayload):**
```json
{
  "task_id": "uuid-of-project-task",
  "assigned_to": "uuid-of-user",
  "remarks": "This is a comment on the task"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/task-comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "task_id": "93de24d0-7b04-4723-aa64-318083172044",
    "assigned_to": "89eb0566-cc40-4997-afb6-3d0c610d4724",
    "remarks": "This is a comment on the task"
  }'
```

**Response (ICreateTaskCommentResponse):**
```json
{
  "status": true,
  "message": "Task comment created successfully",
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "remarks": "This is a comment on the task",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "deleted": false,
    "deleted_at": null,
    "task": {
      "id": "93de24d0-7b04-4723-aa64-318083172044",
      "title": "Sample Project Task",
      "description": "Task description",
      "due_date": "2024-01-20T00:00:00.000Z",
      "status": "Pending",
      "assigned_to": "John Doe",
      "created_at": "2024-01-10T10:00:00.000Z",
      "updated_at": "2024-01-10T10:00:00.000Z",
      "deleted": false,
      "deleted_at": null
    },
    "assignedTo": {
      "id": "89eb0566-cc40-4997-afb6-3d0c610d4724",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "deleted": false,
      "deleted_at": null
    }
  }
}
```

## 2. Get All Comments for a Task

**GET** `/api/task-comments/task/:task_id`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/task-comments/task/93de24d0-7b04-4723-aa64-318083172044 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response (IAllTaskCommentsResponse):**
```json
{
  "status": true,
  "message": "Task comments fetched successfully",
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "remarks": "This is a comment on the task",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "deleted": false,
      "deleted_at": null,
      "task": {
        "id": "93de24d0-7b04-4723-aa64-318083172044",
        "title": "Sample Project Task",
        "description": "Task description",
        "due_date": "2024-01-20T00:00:00.000Z",
        "status": "Pending",
        "assigned_to": "John Doe",
        "created_at": "2024-01-10T10:00:00.000Z",
        "updated_at": "2024-01-10T10:00:00.000Z",
        "deleted": false,
        "deleted_at": null
      },
      "assignedTo": {
        "id": "89eb0566-cc40-4997-afb6-3d0c610d4724",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone_number": "+1234567890",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "deleted": false,
        "deleted_at": null
      }
    }
  ]
}
```

## 3. Get Specific Task Comment

**GET** `/api/task-comments/:id`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/task-comments/123e4567-e89b-12d3-a456-426614174002 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response (ICreateTaskCommentResponse):**
```json
{
  "status": true,
  "message": "Task comment fetched successfully",
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "remarks": "This is a comment on the task",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "deleted": false,
    "deleted_at": null,
    "task": {
      "id": "93de24d0-7b04-4723-aa64-318083172044",
      "title": "Sample Project Task",
      "description": "Task description",
      "due_date": "2024-01-20T00:00:00.000Z",
      "status": "Pending",
      "assigned_to": "John Doe",
      "created_at": "2024-01-10T10:00:00.000Z",
      "updated_at": "2024-01-10T10:00:00.000Z",
      "deleted": false,
      "deleted_at": null
    },
    "assignedTo": {
      "id": "89eb0566-cc40-4997-afb6-3d0c610d4724",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "deleted": false,
      "deleted_at": null
    }
  }
}
```

## 4. Update Task Comment

**PATCH** `/api/task-comments/:id`

**Payload:**
```json
{
  "remarks": "Updated comment text"
}
```

**cURL:**
```bash
curl -X PATCH http://localhost:3000/api/task-comments/123e4567-e89b-12d3-a456-426614174002 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "remarks": "Updated comment text"
  }'
```

**Response (ICreateTaskCommentResponse):**
```json
{
  "status": true,
  "message": "Task comment updated successfully",
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "remarks": "Updated comment text",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z",
    "deleted": false,
    "deleted_at": null,
    "task": {
      "id": "93de24d0-7b04-4723-aa64-318083172044",
      "title": "Sample Project Task",
      "description": "Task description",
      "due_date": "2024-01-20T00:00:00.000Z",
      "status": "Pending",
      "assigned_to": "John Doe",
      "created_at": "2024-01-10T10:00:00.000Z",
      "updated_at": "2024-01-10T10:00:00.000Z",
      "deleted": false,
      "deleted_at": null
    },
    "assignedTo": {
      "id": "89eb0566-cc40-4997-afb6-3d0c610d4724",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "deleted": false,
      "deleted_at": null
    }
  }
}
```

## 5. Delete Task Comment

**DELETE** `/api/task-comments/:id`

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/task-comments/123e4567-e89b-12d3-a456-426614174002 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "status": true,
  "message": "Task comment deleted successfully",
  "success": true
}
```

## Error Responses

### 400 Bad Request
```json
{
  "status": false,
  "message": "Validation error",
  "success": false
}
```

### 404 Not Found
```json
{
  "status": false,
  "message": "Task not found",
  "success": false
}
```

### 401 Unauthorized
```json
{
  "status": false,
  "message": "You are not logged in",
  "success": false
}
```

## Important Notes

1. **Task ID**: The `task_id` must reference a valid project task from the `project_tasks` table
2. **User ID**: The `assigned_to` must reference a valid user from the `users` table
3. **Response Structure**: All responses follow your TypeScript interfaces exactly
4. **Authentication**: All endpoints require a valid JWT token
5. **Soft Delete**: Comments are soft deleted (marked as deleted but not removed from database) 