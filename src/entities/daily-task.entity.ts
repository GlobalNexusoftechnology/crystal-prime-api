import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { Project } from "./projects.entity";
import { User } from "./user.entity";

@Entity('daily_task_entries')
export class DailyTaskEntries extends Model {
    @ManyToOne(() => Project, (project) => project.id, {
        nullable: false,
        eager: true, // if you want auto-populate
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @Column({ type: 'varchar', length: 150 })
    task_title: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    assigned_to: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'date' })
    entry_date: Date;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    hours_spent: number;

    @Column({ type: 'varchar', length: 50, default: 'Pending' })
    status: string;

    @Column({ type: 'text', nullable: true })
    remarks?: string;
}
