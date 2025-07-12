import Model from './model.entity';
import { Entity, Column } from 'typeorm';

@Entity({ name: 'eilog_heads' })
export class EILogHead extends Model {
  @Column({ type: 'text', unique: true, nullable: false })
  name: string;
} 