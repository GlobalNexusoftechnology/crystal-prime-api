# Task Status Change API - Implementation Guide

## Overview

The Task Status Change API implements automatic project status management based on task and milestone status changes. The system follows a cascading logic where task status changes automatically update milestone and project statuses according to specific business rules.

## Logic Flow

### When a Task Status is Updated

#### 1. Task → "Completed"
```
Task Status: "Completed"
↓
Check: Are all tasks under the same milestone "Completed"?
↓
If YES:
  Milestone Status: "Completed"
  ↓
  Check: Are all milestones under the project "Completed"?
  ↓
  If YES:
    Project Status: "Completed"
```

#### 2. Task → "In Progress"
```
Task Status: "In Progress"
↓
Milestone Status: "In Progress"
↓
If milestone startDate is not set:
  Set startDate = current date
  Calculate endDate = startDate + estimatedDays (from template)
↓
Project Status: "In Progress"
```

#### 3. Project Status Rules
- **"Open"**: When any milestone is in "Open" status
- **"In Progress"**: When any milestone is "In Progress" (unless already completed)
- **"Completed"**: When all milestones are "Completed"

## API Endpoints

### 1. Update Task Status
**Endpoint:** `PATCH /api/task-status/tasks/:taskId/status`

**Request Body:**
```json
{
  "status": "Open" | "In Progress" | "Completed"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Task status updated successfully",
  "data": {
    "task": {
      "id": "task-uuid",
      "title": "Task Title",
      "status": "In Progress"
    }
  }
}
```

### 2. Get Project Status Details
**Endpoint:** `GET /api/task-status/projects/:projectId/status`

**Response:**
```json
{
  "status": "success",
  "message": "Project status details retrieved successfully",
  "data": {
    "project": {
      "id": "project-uuid",
      "name": "Project Name",
      "status": "In Progress"
    },
    "milestones": [
      {
        "id": "milestone-uuid",
        "name": "Milestone Name",
        "status": "In Progress",
        "start_date": "2024-01-01T00:00:00.000Z",
        "end_date": "2024-01-15T00:00:00.000Z",
        "tasks": [
          {
            "id": "task-uuid",
            "title": "Task Title",
            "status": "Completed"
          }
        ]
      }
    ]
  }
}
```

### 3. Manual Status Updates (for testing)
**Endpoint:** `PATCH /api/task-status/projects/:projectId/status`
**Endpoint:** `PATCH /api/task-status/milestones/:milestoneId/status`

## Implementation Details

### Core Service: `TaskStatusService`

#### `updateTaskStatus(taskId, newStatus)`
1. Updates task status
2. If status changed, triggers milestone status update
3. Returns updated task

#### `updateMilestoneStatus(milestoneId)`
1. Checks all tasks in the milestone
2. Updates milestone status based on task completion
3. Sets start_date when milestone moves to "In Progress"
4. Triggers project status update
5. Returns updated milestone

#### `updateProjectStatus(projectId)`
1. Checks all milestones in the project
2. Determines project status based on milestone statuses
3. Updates project status if changed
4. Returns updated project

### Business Rules Implementation

#### Milestone Status Logic
```typescript
const allTasksCompleted = tasks.every(task => task.status === "Completed");
const hasInProgressTasks = tasks.some(task => task.status === "In Progress");

if (allTasksCompleted) {
  newStatus = "Completed";
} else if (hasInProgressTasks && milestone.status === "Open") {
  newStatus = "In Progress";
}
```

#### Project Status Logic
```typescript
let newStatus = ProjectStatus.OPEN;
let allMilestonesCompleted = true;
let hasInProgressMilestone = false;

for (const milestone of milestones) {
  if (milestone.status === "In Progress") {
    hasInProgressMilestone = true;
    newStatus = ProjectStatus.IN_PROGRESS;
    break;
  } else if (milestone.status !== "Completed") {
    allMilestonesCompleted = false;
  }
}

if (allMilestonesCompleted && milestones.length > 0) {
  newStatus = ProjectStatus.COMPLETED;
}
```

#### Date Management Logic
```typescript
if (newStatus === "In Progress" && !milestone.start_date) {
  milestone.start_date = new Date();
  
  // Calculate end date from template estimated days
  if (milestone.project?.template) {
    const templateMilestone = await milestoneMasterRepo.findOne({
      where: { 
        template: { id: milestone.project.template.id },
        name: milestone.name 
      }
    });
    
    if (templateMilestone?.estimated_days) {
      const endDate = new Date(milestone.start_date);
      endDate.setDate(endDate.getDate() + templateMilestone.estimated_days);
      milestone.end_date = endDate;
    }
  }
}
```

## Database Schema Changes

### Project Entity
```