import { Entity, Column } from "typeorm";
import Model from "./model.entity";

@Entity("lead_statuses")
export class LeadStatuses extends Model {
  @Column({ unique: true })
  name: string;
}
