// src/entities/client-details.entity.ts
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import Model from "./model.entity";
import { Clients } from "./clients.entity";

@Entity("client_details")
export class ClientDetails extends Model {
  @ManyToOne(() => Clients, (client) => client.id, { nullable: false })
  @JoinColumn({ name: "client_id" })
  client: Clients;

  @Column({ type: "varchar", length: 100 })
  client_contact: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  contact_person: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  email: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  other_contact: string;


  @Column({ type: "varchar", length: 100, nullable: true })
  designation: string;
}
