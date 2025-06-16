import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { ProjectMilestoneMaster } from "./milestone-master.entity";

@Entity('project_task_master')
export class ProjectTaskMaster extends Model {
  @ManyToOne(() => ProjectMilestoneMaster, (milestone) => milestone.id)
  @JoinColumn({ name: 'milestone_master_id' })
  milestone: ProjectMilestoneMaster;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  estimated_days: number;
}
