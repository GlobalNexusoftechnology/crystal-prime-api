// src/schemas/project.schema.ts
import { z } from "zod";
import { ProjectStatus } from "../entities/project-management.entity";

// Schema for creating a new project with only the specified fields
export const CreateProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    leadName: z.string().min(1, "Lead name is required"), 
    renewalDate: z.string().datetime("Invalid date format for renewalDate"), 
    status: z.nativeEnum(ProjectStatus).optional(),
});

// Schema for updating an existing project with only the specified fields
export const UpdateProjectSchema = z.object({
    name: z.string().min(1, "Project name cannot be empty").optional(),
    leadName: z.string().min(1, "Lead name cannot be empty").optional(),
    renewalDate: z.string().datetime("Invalid date format for renewalDate").optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for update."
);