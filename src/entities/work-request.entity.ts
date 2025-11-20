import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { User } from "./user.entity";

@Entity("work_requests")
export class WorkRequest extends Model {
  @ManyToOne(() => User)
  @JoinColumn({ name: "staffId" })
  staff: User;

  @Column()
  staffId: string;

  @Column({ type: "date" })
  requestDate: Date;

  @Column()
  reason: string;

  @Column({ default: "Pending" })
  status: string; // Pending, Approved, Rejected

  @Column({ nullable: true })
  adminRemark: string;
}
