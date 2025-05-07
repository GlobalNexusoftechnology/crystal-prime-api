import { Entity, Column, OneToMany } from "typeorm";
import Model from "./model.entity";
import { Leads } from "./leads.entity";

@Entity("lead_sources")
export class LeadSources extends Model {
  @Column({ unique: true })
  name: string;

  @OneToMany(() => Leads, (lead) => lead.source)
  leads: Leads[];
}
