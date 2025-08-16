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
curl -X GET http://localhost:3000/api/tickets
```

## 3. Get Tickets by Project
```bash
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

### Success Response
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

### Error Response
```json
{
  "status": "error",
  "message": "Error message here"
}
```

## Notes
- Replace `your-project-uuid-here` with an actual project UUID from your database
- Replace `your-ticket-uuid-here` with an actual ticket UUID after creating a ticket
- All UUIDs should be valid UUID format
- The `image_url` field is optional and can be a URL to an uploaded image
- The `image_file` field mentioned in the requirements is handled through file upload middleware (not implemented in this basic version)
