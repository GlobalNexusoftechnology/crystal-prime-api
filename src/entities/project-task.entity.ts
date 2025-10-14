import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { ProjectMilestones } from "./project-milestone.entity";
import { User } from "./user.entity";

@Entity("project_tasks")
export class ProjectTasks extends Model {
  @ManyToOne(() => ProjectMilestones, (milestone) => milestone.tasks)
  @JoinColumn({ name: "milestone_id" })
  milestone: ProjectMilestones;

  @Column({ type: "varchar", length: 150 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "date", nullable: true })
  due_date: Date;

  @Column({ type: "varchar", length: 50, default: "Pending" })
  status: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  assigned_to: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "assigned_by" })
  assigned_by: User;

  @Column({ type: "varchar", length: 50, default: "Medium" })
  priority: string;
}
