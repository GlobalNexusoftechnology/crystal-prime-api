import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { ProjectTasks } from "./project-task.entity";
import { User } from "./user.entity";

@Entity('task_comments')
export class TaskComment extends Model {
    @ManyToOne(() => ProjectTasks, (task) => task.id, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'task_id' })
    task: ProjectTasks;

    @ManyToOne(() => User, (user) => user.id, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'assigned_to' })
    assignedTo: User;

    @Column({ type: 'text', nullable: false })
    remarks: string;
} 