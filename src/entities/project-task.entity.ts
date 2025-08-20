import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import Model from "./model.entity";
import { ProjectMilestones } from "./project-milestone.entity";
import { Ticket } from "./ticket.entity";

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

  @OneToMany(() => Ticket, (ticket) => ticket.task)
  tickets: Ticket[];
}
