import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import Model from "./model.entity";
import { ProjectTemplates } from "./project-templates.entity";
import { ProjectTaskMaster } from "./task-master.entity";

@Entity("project_milestone_master")
export class ProjectMilestoneMaster extends Model {
  @ManyToOne(() => ProjectTemplates, (template) => template.id)
  @JoinColumn({ name: "template_id" })
  template: ProjectTemplates;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "int", nullable: true })
  estimated_days: number;

  @OneToMany(() => ProjectTaskMaster, (task) => task.milestone)
  project_task_master: ProjectTaskMaster[];
}
