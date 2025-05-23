import { Entity, Column } from "typeorm";
import Model from "./model.entity";

@Entity("staff")
export class Staff extends Model {
  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  contact: string;

  @Column({ type: "date" })
  dob: Date;

  @Column()
  role_name: string;
}
