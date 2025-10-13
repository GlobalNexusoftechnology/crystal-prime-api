import { Entity, Column } from "typeorm";
import Model from "./model.entity";

@Entity("holidays")
export class Holiday extends Model {
  @Column()
  holidayName: string;

  @Column({ type: "date" })
  date: Date;
}
