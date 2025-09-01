import { Entity, Column } from "typeorm";
import Model from "./model.entity";

@Entity("page_token")
export class PageToken extends Model {
  @Column({ type: "text" })
  token: string;

  @Column({ type: "timestamp" })
  expiresAt: Date | null;
}
