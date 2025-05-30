import { Entity, Column, OneToMany } from "typeorm";
import Model from "./model.entity";
import { Leads } from "./leads.entity";

@Entity("lead_types")
export class LeadTypes extends Model {
  @Column({ unique: true })
  name: string;

  @OneToMany(() => Leads, (lead) => lead.type)
  leads: Leads[];
}
