import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { Project } from "./projects.entity";

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
}
