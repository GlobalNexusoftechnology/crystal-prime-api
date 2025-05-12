import { Entity, Column, OneToMany } from "typeorm";
import Model from "./model.entity";
import { User } from "./user.entity";

@Entity("roles")
export class Role extends Model {
  @Column()
  name: string;

  @Column("text", { array: true })
  permissions: string[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
