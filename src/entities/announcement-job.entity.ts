import { Entity, Column } from "typeorm";
import Model from "./model.entity";

export type AnnouncementUserType = "staff" | "client";

export type AnnouncementJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

@Entity("announcement_jobs")
export class AnnouncementJob extends Model {
  @Column({ type: "text" })
  message: string;

  @Column({ type: "varchar" })
  userType: AnnouncementUserType;

  @Column({ type: "varchar", default: "pending" })
  status: AnnouncementJobStatus;

  @Column({ type: "int", default: 0 })
  processedCount: number;

  @Column({ type: "text", nullable: true })
  error?: string | null;
}


