import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import Model from "./model.entity";
import { Project } from "./projects.entity";
import { ProjectTasks } from "./project-task.entity";

@Entity("tickets")
export class Ticket extends Model {
  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", length: 50, default: "Open" })
  status: string;

  @Column({ type: "varchar", length: 50, default: "Medium" })
  priority: string;

  @ManyToOne(() => Project, (project) => project.tickets)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "varchar", length: 500, nullable: true })
  image_url: string;

  @Column({ type: "text", nullable: true })
  remark: string;

  @ManyToOne(() => ProjectTasks, (task) => task.tickets, { nullable: true })
  @JoinColumn({ name: "task_id" })
  task: ProjectTasks;
}
