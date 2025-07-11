import Model from './model.entity';
import { Entity, Column } from 'typeorm';

@Entity({ name: 'eilog_types' })
export class EILogType extends Model {
  @Column({ unique: true })
  EIType: string;
} 