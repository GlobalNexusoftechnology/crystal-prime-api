import { Entity, Column, OneToMany } from "typeorm";
import Model from "./model.entity";
import { User } from "./user.entity";

export enum RoleName {
  ADMIN = "Admin",
  SALES = "Sales",
  MANAGER = "Manager",
}

@Entity("roles")
export class Role extends Model {
  
  @Column({
    type: "enum",
    enum: RoleName,
    nullable: true,
  })
  role: RoleName;

  @Column("text", { array: true })
  permissions: string[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
