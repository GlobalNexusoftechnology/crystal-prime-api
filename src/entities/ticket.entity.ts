import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import Model from "./model.entity";
import { Project } from "./projects.entity";
import { ProjectMilestones } from "./project-milestone.entity";
import { ModelWithShortId } from "./model-with-shortid.entity";

@Entity("tickets")
export class Ticket extends ModelWithShortId {
  
  prefix = "ST";

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", length: 50, default: "Open" })
  status: string;

  @Column({ type: "varchar", length: 50, default: "Medium" })
  priority: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  assigned_to: string;

  @ManyToOne(() => Project, (project) => project.tickets)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "varchar", length: 500, nullable: true })
  image_url: string;

  @Column({ type: "text", nullable: true })
  remark: string;

  @ManyToOne(() => ProjectMilestones, (milestone) => milestone.tickets, { nullable: true })
  @JoinColumn({ name: "milestone_id" })
  milestone: ProjectMilestones;
}
