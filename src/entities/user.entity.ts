import {
  Entity,
  Column,
  Index,
  BeforeInsert,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import bcrypt from "bcryptjs";
import Model from "./model.entity";
import { Leads } from "./leads.entity";
import { LeadAttachments } from "./lead-attachments.entity";
import { LeadStatusHistory } from "./lead-status-history.entity";
import { Task } from "./task-management.entity";
import { Role } from "./roles.entity";
import { projectAttachments } from "./project-attachments.entity";
import { EILog } from "./eilog.entity";
import { Clients } from "./clients.entity";
import { Leave } from "./leaves.entity";
import { Attendance } from "./attendance.entity";
import { ProjectTasks } from "./project-task.entity";

@Entity("users")
export class User extends Model {
  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column({ type: "varchar", length: 50, nullable: true, unique: true })
  employee_id: string | null;


  @Column({ nullable: true })
  phone_number: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: "role_id" })
  role: Role;

  @Column({ type: "timestamp", nullable: true })
  dob: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "team_lead_id" })
  team_lead: User | null;

  @Column({ type: "varchar", length: 6, nullable: true })
  otp: string | null;

  @Column({ type: "timestamp", nullable: true })
  otpExpiresAt: Date | null;

  @Column({ default: false })
  isOtpVerified: boolean;

  @Column({ nullable: true })
  keywords?: string[] ;

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

  @OneToOne(() => Clients, (client) => client.user)
  client: Clients;

  @OneToMany(() => Leave, (leave) => leave.staff)
  leaves: Leave[];

  @OneToMany(() => Attendance, (attendance) => attendance.staff)
  attendance: Attendance[];

  @OneToMany(() => ProjectTasks, (task) => task.assigned_by)
  tasks_assigned_by: ProjectTasks[];

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
