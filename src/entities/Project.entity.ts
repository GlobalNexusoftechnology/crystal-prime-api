import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import Model from "./model.entity";
import { Clients } from "./clients.entity";
import { projectAttachments } from "./project-attachments.entity";

@Entity("Project ")
export class Project extends Model {
  @ManyToOne(() => Clients, (client) => client.id, { nullable: true })
  @JoinColumn({ name: "client_id" })
  client: Clients;

  @Column({ type: "varchar", length: 150, nullable: false })
  name: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  project_type: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  budget: number;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  estimated_cost: number;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  actual_cost: number;

  @Column({ type: "timestamp", nullable: true })
  start_date: Date;

  @Column({ type: "timestamp", nullable: true })
  end_date: Date;

  @Column({ type: "timestamp", nullable: true })
  actual_start_date: Date;

  @Column({ type: "timestamp", nullable: true })
  actual_end_date: Date;

  @OneToMany(() => projectAttachments, (attachment) => attachment.Project)
  attachments: projectAttachments[];
}
