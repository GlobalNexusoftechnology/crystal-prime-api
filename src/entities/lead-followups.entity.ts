import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { Leads } from "./leads.entity";
import { User } from "./user.entity";

export enum FollowupStatus {
    RESCHEDULE = "RESCHEDULE",
    PENDING = "PENDING",
    AWAITING_RESPONSE = "AWAITING RESPONSE",
    NO_RESPONSE = "NO RESPONSE",
    FAILED = "FAILED",
    COMPLETED = "COMPLETED",
}

@Entity("lead_followups")
export class LeadFollowup extends Model {
    @ManyToOne(() => Leads, (lead) => lead.followups, { onDelete: "CASCADE" })
    @JoinColumn({ name: "lead_id" })
    lead: Leads;

    @ManyToOne(() => User, (user) => user.id, { onDelete: "SET NULL", nullable: true })
    @JoinColumn({ name: "user_id" })
    user: User | null;

    @Column({
        type: "enum",
        enum: FollowupStatus,
        default: FollowupStatus.PENDING,
    })
    status: FollowupStatus;

    @Column({ type: "timestamp", nullable: true })
    due_date: Date;

    @Column({ type: "timestamp", nullable: true })
    completed_date: Date;

    @Column({ type: "text", nullable: true })
    remarks: string;
}
