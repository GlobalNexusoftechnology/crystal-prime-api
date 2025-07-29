import { Entity, Column, OneToMany } from "typeorm";
import Model from "./model.entity";
import { Leads } from "./leads.entity";
import { Project } from "./projects.entity";

@Entity("lead_types")
export class LeadTypes extends Model {
  @Column()
  name: string;

  @OneToMany(() => Leads, (lead) => lead.type)
  leads: Leads[];

  @OneToMany(() => Project, (project) => project.project_type)
  projects: Project[];
}
