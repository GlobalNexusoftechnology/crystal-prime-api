import {
  Entity,
  Column,
} from 'typeorm';
import Model from './model.entity';

@Entity('sessions')
export class Session extends Model {
  @Column()
  userId: string;

  @Column({ default: false })
  isExpired: boolean;

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string;
}
