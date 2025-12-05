import { Column, Entity, ManyToOne } from "typeorm";
import Model from "./model.entity";
import { Material } from "./material.entity";

@Entity("inventory_history")
export class InventoryHistory extends Model {
  @Column({ type: "date" })
  date: string;

  @Column({ type: "int" })
  used: number;

  @Column({ type: "text", nullable: true })
  notes: string;

  @ManyToOne(() => Material, (material) => material.inventoryHistory, {
    nullable: false,
  })
  material: Material;
}
