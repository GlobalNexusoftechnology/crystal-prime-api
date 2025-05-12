import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { Leads } from "./leads.entity";
import { User } from "./user.entity";
import { LeadStatuses } from "./lead-statuses.entity";

@Entity("lead_status_history")
export class LeadStatusHistory extends Model {
  @ManyToOne(() => Leads, (lead) => lead.status_histories, { nullable: false })
  @JoinColumn({ name: "lead_id" })
  lead: Leads;

  @ManyToOne(() => LeadStatuses, (status) => status.status_histories, { nullable: true })
  @JoinColumn({ name: "status_id" })
  status: LeadStatuses | null;

  @ManyToOne(() => User, (user) => user.changed_statuses, { nullable: true })
  @JoinColumn({ name: "changed_by" })
  changed_by: User | null;

  @Column({ type: "text", nullable: true })
  status_remarks: string | null;
}
