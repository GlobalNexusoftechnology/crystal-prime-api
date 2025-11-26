import { Entity, Column, OneToMany } from "typeorm";
import Model from "./model.entity";
import { Material } from "./material.entity";

@Entity({ name: "material_brands" })
export class MaterialBrand extends Model {
  @Column({ type: "varchar", length: 150, nullable: false })
  name: string;

  @OneToMany(
    () => Material,
    (material: { materialBrand: any }) => material.materialBrand
  )
  materials: Material[];
}
