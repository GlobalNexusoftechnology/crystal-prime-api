import { Entity, Column, OneToMany } from 'typeorm';
import Model from './model.entity';
import { ProjectMilestoneMaster } from './milestone-master.entity';

@Entity('project_templates')
export class ProjectTemplates extends Model {
    @Column({ type: 'text' })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    project_type: string;

    @Column({ type: 'int', nullable: true })
    estimated_days: number;

    @OneToMany(() => ProjectMilestoneMaster, (milestone) => milestone.template)
    project_milestone_master: ProjectMilestoneMaster[];
}