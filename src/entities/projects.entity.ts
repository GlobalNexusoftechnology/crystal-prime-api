import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import Model from "./model.entity";
import { Clients } from "./clients.entity";
import { projectAttachments } from "./project-attachments.entity";
import { ProjectMilestones } from "./project-milestone.entity";
import { ProjectTasks } from "./project-task.entity";
import { ProjectTemplates } from "./project-templates.entity";
import { User } from "./user.entity";

export enum ProjectRenewalType {
  NONE = "NONE",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM"
}

@Entity("Project ")
export class Project extends Model {
  @ManyToOne(() => Clients, (client) => client.id, { nullable: true })
  @JoinColumn({ name: "client_id" })
  client: Clients;

  @Column({ type: "varchar", length: 150, nullable: false })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;
  
  @Column({ type: "varchar", length: 100, nullable: true })
  project_type: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  budget: number;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  estimated_cost: number;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  actual_cost: number;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  cost_of_labour: number;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  overhead_cost: number;

  @Column({ type: "timestamp", nullable: true })
  start_date: Date;

  @Column({ type: "timestamp", nullable: true })
  end_date: Date;

  @Column({ type: "timestamp", nullable: true })
  actual_start_date: Date;

  @Column({ type: "timestamp", nullable: true })
  actual_end_date: Date;

  @Column({
    type: "enum",
    enum: ProjectRenewalType,
    nullable: true
  })
  renewal_type: ProjectRenewalType;

  @Column({ type: "timestamp", nullable: true })
  renewal_date: Date;

  @Column({ type: "boolean", default: false })
  is_renewal: boolean;

  @ManyToOne(() => ProjectTemplates, { nullable: true })
  @JoinColumn({ name: "template_id" })
  template: ProjectTemplates;

  @OneToMany(() => projectAttachments, (attachment) => attachment.Project)
  attachments: projectAttachments[];

  @OneToMany(() => ProjectMilestones, (milestone) => milestone.project)
  milestones: ProjectMilestones[];
}
