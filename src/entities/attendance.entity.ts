import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import Model from "./model.entity";

@Entity("attendance")
export class Attendance extends Model {
  @ManyToOne(() => User, (user) => user.attendance)
  @JoinColumn({ name: "staffId" })
  staff: User;

  @Column()
  staffId: string;

  @Column({ type: "time", nullable: true })
  inTime: string;

  @Column({ type: "time", nullable: true })
  outTime: string;

  @Column({ type: "date" })
  date: Date;

  @Column({ nullable: true })
  totalHours: string;
}
