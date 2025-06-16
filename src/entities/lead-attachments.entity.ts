import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { Leads } from "./leads.entity";
import { User } from "./user.entity";

@Entity("lead_attachments")
export class LeadAttachments extends Model {
  @ManyToOne(() => Leads, (lead) => lead.attachments, { nullable: false })
  @JoinColumn({ name: "lead_id" })
  lead: Leads;

  @ManyToOne(() => User, (user) => user.lead_attachments, { nullable: true })
  @JoinColumn({ name: "uploaded_by" })
  uploaded_by: User;

  @Column({ nullable: true })
  file_path: string;

  @Column({ nullable: true })
  file_type: string;

  @Column({nullable: true})
  file_name: string;
}
