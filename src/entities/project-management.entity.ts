import { Entity, Column, OneToMany, } from "typeorm";
import Model from "./model.entity";
import { Task } from "./task-management.entity";

export enum ProjectStatus {
    OPEN = 'Open',
    IN_PROGRESS = 'In Progress',
    FINAL = 'Final',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
    ON_HOLD = 'On Hold'
}

@Entity('projects')
export class Project extends Model {
    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    leadName: string;

    @Column({ type: 'timestamp', nullable: true })
    renewalDate: Date;

    @Column({
        type: 'enum',
        enum: ProjectStatus,
        default: ProjectStatus.OPEN,
        nullable: false
    })
    status: ProjectStatus;

    @OneToMany(() => Task, (task) => task.project)
    tasks: Task[];
}