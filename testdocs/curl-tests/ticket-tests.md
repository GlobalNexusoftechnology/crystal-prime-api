# Ticket Management API Tests

## Base URL
```
http://localhost:3000/api/tickets
```

## 1. Create Ticket
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bug Fix Required",
    "description": "Critical bug in login functionality",
    "status": "Open",
    "priority": "High",
    "project_id": "your-project-uuid-here",
    "remark": "Urgent fix needed"
  }'
```

## 2. Get All Tickets
```bash
# Get all tickets with pagination
curl -X GET "http://localhost:3000/api/tickets?page=1&limit=10"

# Get all tickets with search
curl -X GET "http://localhost:3000/api/tickets?searchText=bug&page=1&limit=10"

# Get all tickets filtered by status
curl -X GET "http://localhost:3000/api/tickets?status=open&page=1&limit=10"

# Get all tickets filtered by priority
curl -X GET "http://localhost:3000/api/tickets?priority=high&page=1&limit=10"

# Get all tickets with multiple filters
curl -X GET "http://localhost:3000/api/tickets?status=in_progress&priority=medium&page=1&limit=10"

# Get all tickets (default pagination)
curl -X GET http://localhost:3000/api/tickets
```

## 3. Get Tickets by Project
```bash
# Get tickets by project with pagination
curl -X GET "http://localhost:3000/api/tickets/project/your-project-uuid-here?page=1&limit=10"

# Get tickets by project with search
curl -X GET "http://localhost:3000/api/tickets/project/your-project-uuid-here?searchText=critical&page=1&limit=10"

# Get tickets by project filtered by status
curl -X GET "http://localhost:3000/api/tickets/project/your-project-uuid-here?status=resolved&page=1&limit=10"

# Get tickets by project filtered by priority
curl -X GET "http://localhost:3000/api/tickets/project/your-project-uuid-here?priority=low&page=1&limit=10"

# Get tickets by project with multiple filters
curl -X GET "http://localhost:3000/api/tickets/project/your-project-uuid-here?status=in_progress&priority=medium&page=1&limit=10"

# Get tickets by project (default pagination)
curl -X GET http://localhost:3000/api/tickets/project/your-project-uuid-here
```

## 4. Get Ticket by ID
```bash
curl -X GET http://localhost:3000/api/tickets/your-ticket-uuid-here
```

## 5. Update Ticket
```bash
curl -X PUT http://localhost:3000/api/tickets/your-ticket-uuid-here \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bug Fix Required - Updated",
    "status": "In Progress",
    "priority": "Medium",
    "remark": "Working on the fix"
  }'
```

## 6. Delete Ticket
```bash
curl -X DELETE http://localhost:3000/api/tickets/your-ticket-uuid-here
```

## Expected Response Format

### Success Response (Single Ticket)
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Ticket Title",
    "description": "Ticket Description",
    "status": "Open",
    "priority": "High",
    "project_id": "project-uuid",
    "image_url": "https://example.com/image.jpg",
    "remark": "Additional notes",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "deleted": false,
    "project": {
      "id": "project-uuid",
      "name": "Project Name",
      // ... other project fields
    }
  }
}
```

### Success Response (List with Pagination)
```json
{
  "status": "success",
  "message": "All Tickets fetched",
  "data": {
    "list": [
      {
        "id": "uuid",
        "title": "Ticket Title",
        "description": "Ticket Description",
        "status": "Open",
        "priority": "High",
        "project_id": "project-uuid",
        "image_url": "https://example.com/image.jpg",
        "remark": "Additional notes",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "deleted": false,
        "project": {
          "id": "project-uuid",
          "name": "Project Name"
        }
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error message here"
}
```

## Query Parameters

### Pagination Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 10)

### Search Parameters
- `searchText` (optional): Search text to filter tickets by title, description, status, priority, remark, or project name

### Filter Parameters
- `status` (optional): Filter tickets by specific status (e.g., "open", "in_progress", "resolved", "closed")
- `priority` (optional): Filter tickets by specific priority (e.g., "low", "medium", "high", "critical")

### Examples
```bash
# Get first page with 5 items per page
GET /api/tickets?page=1&limit=5

# Search for tickets containing "bug" in any field
GET /api/tickets?searchText=bug&page=1&limit=10

# Filter tickets by status
GET /api/tickets?status=in_progress&page=1&limit=10

# Filter tickets by priority
GET /api/tickets?priority=high&page=1&limit=10

# Combine multiple filters
GET /api/tickets?status=open&priority=medium&page=1&limit=10

# Get tickets for a specific project with filters
GET /api/tickets/project/your-project-uuid?status=resolved&priority=low&page=2&limit=20
```

## Notes
- Replace `your-project-uuid-here` with an actual project UUID from your database
- Replace `your-ticket-uuid-here` with an actual ticket UUID after creating a ticket
- All UUIDs should be valid UUID format
- The `image_url` field is optional and can be a URL to an uploaded image
- The `image_file` field mentioned in the requirements is handled through file upload middleware (not implemented in this basic version)
- Search is case-insensitive and searches across multiple fields
- Pagination is applied to both "Get All Tickets" and "Get Tickets by Project" endpoints
