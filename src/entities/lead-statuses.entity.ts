import { Entity, Column, OneToMany } from "typeorm";
import Model from "./model.entity";
import { Leads } from "./leads.entity";

@Entity("lead_statuses")
export class LeadStatuses extends Model {
  @Column({ unique: true })
  name: string;

  @OneToMany(() => Leads, (lead) => lead.status)
  leads: Leads[];
}
