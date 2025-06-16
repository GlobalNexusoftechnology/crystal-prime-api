import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import Model from './model.entity';
import { Leads } from './leads.entity';

@Entity('clients')
export class Clients extends Model {
  @ManyToOne(() => Leads, (lead) => lead.id, { nullable: true })
  @JoinColumn({ name: 'lead_id' })
  lead: Leads;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  contact_number: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  company_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contact_person: string;

}
