import { Entity, Column } from 'typeorm';
import Model from './model.entity';

@Entity('project_templates')
export class ProjectTemplates extends Model {
    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    project_type: string;

    @Column({ type: 'int', nullable: true })
    estimated_days: number;
}