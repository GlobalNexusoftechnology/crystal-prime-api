import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { Project } from "./projects.entity";

@Entity("project_milestones")
export class ProjectMilestones extends Model {
  @ManyToOne(() => Project, (project) => project.id)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "timestamp", nullable: true })
  start_date: Date;

  @Column({ type: "timestamp", nullable: true })
  end_date: Date;

  @Column({ type: "timestamp", nullable: true })
  actual_date: Date;

  @Column({ type: "timestamp", nullable: true })
  estimated_date: Date;

  @Column({ type: "varchar", length: 100, nullable: true })
  assigned_to: string;

  @Column({ type: "varchar", length: 50 })
  status: string;

  @Column({ type: "text", nullable: true })
  remark: string;
}

