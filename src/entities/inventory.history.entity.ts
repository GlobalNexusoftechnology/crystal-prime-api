import { Column, Entity, ManyToOne } from "typeorm";
import Model from "./model.entity";
import { Material } from "./material.entity";
import { Inventory } from "./inventory.entity";

@Entity("inventory_history")
export class InventoryHistory extends Model {
  @Column({ type: "date" })
  date: string;

  @Column({ type: "int" })
  used: number;

  @Column({ type: "text", nullable: true })
  notes: string;

  @ManyToOne(() => Inventory, (inventory) => inventory.inventoryHistory, {
    nullable: false,
  })
  inventory: Inventory;

  @ManyToOne(() => Material, (material) => material.inventoryHistory, {
    nullable: false,
  })
  material: Material;
}
