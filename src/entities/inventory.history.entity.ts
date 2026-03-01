import { Column, Entity, ManyToOne } from "typeorm";
import { Inventory } from "./inventory.entity";
import Model from "./model.entity";

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
}
