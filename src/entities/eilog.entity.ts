import Model from './model.entity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EILogType } from './eilog-type.entity';
import { EILogHead } from './eilog-head.entity';
import { User } from './user.entity';

export enum PaymentModeEnum {
  CASH = 'Cash',
  ONLINE = 'Online',
  UPI = 'UPI',
  BANK_TRANSFER = 'Bank Transfer',
  CHEQUE = 'Cheque',
  OTHERS = 'Others',
}

@Entity({ name: 'eilogs' })
export class EILog extends Model {
  @ManyToOne(() => EILogType)
  @JoinColumn({ name: 'eilog_type_id' })
  eilogType: EILogType;

  @ManyToOne(() => EILogHead)
  @JoinColumn({ name: 'eilog_head_id' })
  eilogHead: EILogHead;

  @ManyToOne(() => User, (user) => user.eilogs)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  income: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  expense: string;

  @Column({ type: 'enum', enum: PaymentModeEnum })
  paymentMode: PaymentModeEnum;

  @Column({ type: 'text', nullable: true })
  attachment?: string;
} 