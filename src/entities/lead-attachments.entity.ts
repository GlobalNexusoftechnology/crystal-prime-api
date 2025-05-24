import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { Leads } from "./leads.entity";
import { User } from "./user.entity";

@Entity("lead_attachments")
export class LeadAttachments extends Model {
  @ManyToOne(() => Leads, (lead) => lead.attachments, { nullable: false })
  @JoinColumn({ name: "lead_id" })
  lead: Leads;

  @ManyToOne(() => User, (user) => user.lead_attachments, { nullable: false })
  @JoinColumn({ name: "uploaded_by" })
  uploaded_by: User;

  @Column()
  file_path: string;

  @Column()
  file_type: string;
}
