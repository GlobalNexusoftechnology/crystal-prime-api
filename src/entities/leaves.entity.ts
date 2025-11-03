import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { User } from "./user.entity";

@Entity("leaves")
export class Leave extends Model {
  @ManyToOne(() => User, (staff) => staff.leaves)
  @JoinColumn({ name: "staffId" })
  staff: User;

  @Column()
  staffId: string;

  @Column({ type: "date" })
  appliedDate: Date;

  @Column({ type: "date" })
  fromDate: Date;

  @Column({ type: "date" })
  toDate: Date;

  @Column()
  leaveType: string; // Half Day / Full Day / Sick Leave / EL

  @Column({ nullable: true })
  leaveCategory: string;
  
  @Column({ nullable: true })
  description: string;

  @Column({ default: "Pending" })
  status: string; // Approved / Not Approved

  @Column({ nullable: true })
  adminRemark: string;
}
