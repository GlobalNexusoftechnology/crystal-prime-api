import { EILog } from './eilog.entity';
import Model from './model.entity';
import { Entity, Column, OneToMany } from 'typeorm';

@Entity({ name: 'eilog_heads' })
export class EILogHead extends Model {
  @Column({ type: 'text', unique: true, nullable: true })
  name: string;

  @OneToMany(() => EILog, (eilog: EILog) => eilog.eilogHead)
  eilogs: EILog[];
} 