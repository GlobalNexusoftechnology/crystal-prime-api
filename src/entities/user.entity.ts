import { Entity, Column, Index, BeforeInsert, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import bcrypt from "bcryptjs";
import Model from "./model.entity";
import { Leads } from "./leads.entity";
import { LeadAttachments } from "./lead-attachments.entity";
import { LeadStatusHistory } from "./lead-status-history.entity";
import { Task } from "./task-management.entity";
import { Role } from "./roles.entity";
import { projectAttachments } from "./project-attachments.entity";
import { EILog } from "./eilog.entity";

@Entity("users")
export class User extends Model {
  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column({ nullable: true })
  phone_number: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ type: "timestamp", nullable: true })
  dob: Date;

  @Column({ type: "varchar", length: 6, nullable: true })
  otp: string | null;

  @Column({ type: "timestamp", nullable: true })
  otpExpiresAt: Date | null;

  @Column({ default: false })
  isOtpVerified: boolean;

  @Column({ nullable: false })
  password: string;

  @OneToMany(() => Leads, (lead) => lead.assigned_to)
  assignedLeads: Leads[];

  @OneToMany(() => LeadAttachments, (attachment) => attachment.uploaded_by)
  lead_attachments: LeadAttachments[];

  @OneToMany(() => projectAttachments, (attachment) => attachment.uploaded_by)
  project_attachments: projectAttachments[];

  @OneToMany(() => LeadStatusHistory, (status) => status.changed_by)
  changed_statuses: LeadStatusHistory[];

  @OneToMany(() => Task, (task) => task.assignedTo)
  assignedTasks: Task[];

  @OneToMany(() => EILog, (eilog: EILog) => eilog.createdBy)
  eilogs: EILog[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  static async comparePasswords(
    candidatePassword: string,
    hashedPassword: string
  ) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}
