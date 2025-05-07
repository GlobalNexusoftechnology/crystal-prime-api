import { Entity, Column } from "typeorm";
import Model from "./model.entity";

@Entity("lead_sources")
export class LeadSources extends Model {
  @Column({ unique: true })
  name: string;
}
