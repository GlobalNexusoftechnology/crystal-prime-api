import { Entity, Column, OneToMany } from "typeorm";
import Model from "./model.entity";
import { Material } from "./material.entity";

@Entity({ name: "material_types" })
export class MaterialType extends Model {
  @Column({ type: "varchar", length: 150, nullable: false })
  name: string;

  @OneToMany(
    () => Material,
    (material: { materialType: any }) => material.materialType
  )
  materials: Material[];
}
