import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import Model from './model.entity';
import { User } from './user.entity';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  LEAD_UPDATED = 'LEAD_UPDATED',
  LEAD_STATUS_CHANGED = 'LEAD_STATUS_CHANGED',
  FOLLOWUP_CREATED = 'FOLLOWUP_CREATED',
  FOLLOWUP_UPDATED = 'FOLLOWUP_UPDATED',
  FOLLOWUP_REMINDER = 'FOLLOWUP_REMINDER',
  QUOTATION_SENT = 'QUOTATION_SENT',
  BUSINESS_DONE = 'BUSINESS_DONE',
  LEAD_ESCALATED = 'LEAD_ESCALATED',
  PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED',
  TICKET_COMMENT_ADDED = 'TICKET_COMMENT_ADDED'
}

@Entity('notifications')
export class Notification extends Model {
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;
} 