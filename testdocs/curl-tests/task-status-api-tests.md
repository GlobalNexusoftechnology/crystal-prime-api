# Task Status Change API Tests

This document contains curl commands to test the task status change API and project status management system.

## API Endpoints

### 1. Update Task Status
**Endpoint:** `PATCH /api/task-status/tasks/:taskId/status`
**Description:** Updates task status and automatically cascades to milestone and project status

```bash
curl -X PATCH http://localhost:3000/api/task-status/tasks/TASK_ID_HERE/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress"
  }'
```

**Valid Status Values:**
- `"Open"`
- `"In Progress"`
- `"Completed"`

### 2. Get Project Status Details
**Endpoint:** `GET /api/task-status/projects/:projectId/status`
**Description:** Get detailed project status with milestone and task information

```bash
curl -X GET http://localhost:3000/api/task-status/projects/PROJECT_ID_HERE/status \
  -H "Content-Type: application/json"
```

### 3. Manually Update Project Status
**Endpoint:** `PATCH /api/task-status/projects/:projectId/status`
**Description:** Manually trigger project status update (for testing)

```bash
curl -X PATCH http://localhost:3000/api/task-status/projects/PROJECT_ID_HERE/status \
  -H "Content-Type: application/json"
```

## Test Scenarios

### Scenario 1: Task Status Change Flow

1. **Update task status to "In Progress"**
   ```bash
   curl -X PATCH http://localhost:3000/api/task-status/tasks/TASK_ID/status \
     -H "Content-Type: application/json" \
     -d '{"status": "In Progress"}'
   ```
   **Expected Result:**
   - Task status: "In Progress"
   - Milestone status: "In Progress" (if was "Open")
   - Project status: "In Progress"
   - Milestone start_date: Set to current date

2. **Update task status to "Completed"**
   ```bash
   curl -X PATCH http://localhost:3000/api/task-status/tasks/TASK_ID/status \
     -H "Content-Type: application/json" \
     -d '{"status": "Completed"}'
   ```
   **Expected Result:**
   - Task status: "Completed"
   - Milestone status: "Completed" (if all tasks are completed)
   - Project status: "Completed" (if all milestones are completed)

## Business Rules Verification

### Rule 1: Project Status Based on Milestone Status
- ✅ When any milestone is "Open" → Project status: "Open"
- ✅ When any milestone is "In Progress" → Project status: "In Progress"
- ✅ When all milestones are "Completed" → Project status: "Completed"

### Rule 2: Milestone Status Based on Task Status
- ✅ When any task is "In Progress" → Milestone status: "In Progress"
- ✅ When all tasks are "Completed" → Milestone status: "Completed"

### Rule 3: Automatic Date Management
- ✅ When milestone moves to "In Progress" → start_date is set automatically 