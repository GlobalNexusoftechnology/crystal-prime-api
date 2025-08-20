import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import Model from "./model.entity";
import { Leads } from "./leads.entity";
import { ClientDetails } from "./clients-details.entity";
import { User } from "./user.entity";

@Entity("clients")
export class Clients extends Model {
  @ManyToOne(() => Leads, (lead) => lead.id, { nullable: true })
  @JoinColumn({ name: "lead_id" })
  lead: Leads;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  email: string;

  @Column({ type: "varchar", length: 20 })
  contact_number: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "text", nullable: true })
  website: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  company_name: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  contact_person: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  gst_number: string;

  @Column({ type: "boolean", default: false })
  isCredential: boolean;

  @OneToMany(() => ClientDetails, (detail) => detail.client)
  client_details: ClientDetails[];

  @OneToOne(() => User, (user) => user.client, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user: User;
}
