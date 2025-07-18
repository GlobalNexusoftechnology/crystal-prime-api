// lead.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import Model from "./model.entity";
import { LeadSources } from "./lead-sources.entity";
import { LeadStatuses } from "./lead-statuses.entity";
import { User } from "./user.entity";
import { LeadFollowup } from "./lead-followups.entity";
import { LeadAttachments } from "./lead-attachments.entity";
import { LeadStatusHistory } from "./lead-status-history.entity";
import { LeadTypes } from "./lead-type.entity";

@Entity('leads')
export class Leads extends Model {
  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  created_by: string;

  @Column({ nullable: true })
  updated_by: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'boolean', default: false })
  escalate_to?: boolean;

  @Column({ nullable: true })
  other_contact: string;

  // Replace the existing email column
  @Column({ type: 'text', array: true, nullable: true })
  email: string[];

  @Column({ nullable: true })
  location: string;

  @Column('decimal', { nullable: true })
  budget: number;

  @Column('text', { nullable: true })
  requirement: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  possibility_of_conversion?: number | null;

  @ManyToOne(() => LeadSources, (source) => source.leads, { nullable: true })
  @JoinColumn({ name: "source_id" })
  source: LeadSources | null;

  @ManyToOne(() => LeadTypes, (type) => type.leads, { nullable: true })
  @JoinColumn({ name: "type_id" })
  type: LeadTypes | null;

  @ManyToOne(() => LeadStatuses, (status) => status.leads, { nullable: true })
  @JoinColumn({ name: 'status_id' })
  status: LeadStatuses | null;

  @ManyToOne(() => User, (user) => user.assignedLeads, { nullable: true })
  @JoinColumn({ name: "assigned_to" })
  assigned_to: User | null;

  @OneToMany(() => LeadFollowup, (followup) => followup.lead)
  followups: LeadFollowup[];

  @OneToMany(() => LeadAttachments, (attachment) => attachment.lead)
  attachments: LeadAttachments[];

  @OneToMany(() => LeadStatusHistory, (history) => history.lead)
  status_histories: LeadStatusHistory[];
}

