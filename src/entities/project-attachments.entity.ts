import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { Project } from "./Project.entity";
import { User } from "./user.entity";

@Entity("project_attachments")
export class projectAttachments extends Model {
  @ManyToOne(() => Project, (Project) => Project.attachments, { nullable: false })
  @JoinColumn({ name: "Project_id" })
  Project: Project;

  @ManyToOne(() => User, (user) => user.project_attachments, { nullable: true })
  @JoinColumn({ name: "uploaded_by" })
  uploaded_by: User | null;

  @Column({ nullable: true })
  file_path: string;

  @Column({ nullable: true })
  file_type: string;

  @Column({nullable: true})
  file_name: string;
}