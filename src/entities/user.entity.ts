import { Entity, Column, Index, BeforeInsert, OneToMany } from "typeorm";
import bcrypt from "bcryptjs";
import Model from "./model.entity";
import { Leads } from "./leads.entity";
import { LeadAttachments } from "./lead-attachments.entity";
import { LeadStatusHistory } from "./lead-status-history.entity";

export enum RoleEnumType {
  DEVELOPER = "developer",
  ADMIN = "admin",
  CUSTOMER = "customer",
}

@Entity("users")
export class User extends Model {
 
  @Column({
    type: "enum",
    enum: RoleEnumType,
    default: RoleEnumType.DEVELOPER,
  })
  role: RoleEnumType;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column({ nullable: true })
  number: string;

  @Column({ nullable: true })
  role_id: number;

  @Column({ type: "timestamp", nullable: true })
  dob: Date;

  @Index("verificationCode_index")
  @Column({ type: "text", nullable: true })
  verificationCode!: string | null;

  @Column({ nullable: true })
  authToken: string;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ type: "varchar", length: 6, nullable: true })
  otp: string | null;

  @Column({ type: "timestamp", nullable: true })
  otpExpiresAt: Date | null;

  @Column({ default: false })
  isOtpVerified: boolean;

  @Column({ nullable: false })
  password: string;

  @OneToMany(() => LeadAttachments, (attachment) => attachment.uploaded_by)
  lead_attachments: LeadAttachments[];

  @OneToMany(() => LeadStatusHistory, (status) => status.changed_by)
  changed_statuses: LeadStatusHistory[];
  assignedTasks: any;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 12);
  }

  @OneToMany(() => Leads, (lead) => lead.assigned_to)
  assignedLeads: Leads[];

  static async comparePasswords(
    candidatePassword: string,
    hashedPassword: string
  ) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}
