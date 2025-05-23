import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { User } from "./user.entity";
import { Project } from "./project-management.entity";

export enum TaskPriority {
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low',
}

export enum TaskStatus {
    OPEN = 'Open',
    IN_PROGRESS = 'In Progress',
    FINAL = 'Final',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
    ON_HOLD = 'On Hold',
}

@Entity('tasks')
export class Task extends Model {
    @Column({ type: 'varchar', length: 255, nullable: false })
    taskName: string;

    @Column({
        type: 'enum',
        enum: TaskPriority,
        default: TaskPriority.MEDIUM,
        nullable: false
    })
    priority: TaskPriority;

    @Column({ type: 'timestamp', nullable: true })
    endDate: Date;

    @ManyToOne(() => User, (user) => user.assignedTasks, { nullable: true })
    @JoinColumn({ name: "assigned_to_id" })
    assignedTo: User | null;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.OPEN,
        nullable: false
    })
    status: TaskStatus;

    @ManyToOne(() => Project, (project) => project.tasks, { nullable: true })
    @JoinColumn({ name: "project_id" })
    project: Project | null;

    @Column({ type: 'text', nullable: true })
    description: string;
}