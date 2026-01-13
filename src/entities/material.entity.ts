import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import Model from "./model.entity";
import { MaterialType } from "./material-type.entity";
import { MaterialBrand } from "./material-brand.entity";
import { InventoryHistory } from "./inventory.history.entity";
export type StatePrices = {
  Maharashtra?: number;
  Karnataka?: number;
  Telangana?: number;
  Gujarat?: number;
  Chhattisgarh?: number;
  Delhi?: number;
  Goa?: number;
};


@Entity("materials")
export class Material extends Model {
  @Column({ type: "varchar", length: 150, nullable: false })
  name: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  code: string;

  @ManyToOne(
    () => MaterialBrand,
    (brand: { materials: any }) => brand.materials,
    { nullable: true }
  )
  materialBrand: MaterialBrand;

  @ManyToOne(
    () => MaterialType,
    (type: { materials: any }) => type.materials,
    { nullable: true }
  )
  materialType: MaterialType;

  @Column({ type: "varchar", length: 50, nullable: true })
  size: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  uom: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  pressure: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  hsn: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  gst: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  purchase_price: number;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  sales_price: number;

  @Column({ type: "text", array: true, nullable: true })
  photos: string[];

  @Column({ type: "boolean", nullable: true })
  active: boolean;

  @Column({ type: "text", nullable: true })
  sales_description: string;

  @Column({ type: "text", nullable: true })
  purchase_description: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  alias: string;

  @Column({ nullable: true })
  quantity: number;
@Column({ type: "jsonb", nullable: true })
state_prices: StatePrices;

   @OneToMany(
    () => InventoryHistory,
    (history: InventoryHistory) => history.material
  )
  inventoryHistory: InventoryHistory[];
}

