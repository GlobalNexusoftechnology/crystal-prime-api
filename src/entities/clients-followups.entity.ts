import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { Clients } from "./clients.entity";
import { User } from "./user.entity";

export enum ClientFollowupStatus {
    RESCHEDULE = "RESCHEDULE",
    PENDING = "PENDING",
    AWAITING_RESPONSE = "AWAITING RESPONSE",
    NO_RESPONSE = "NO RESPONSE",
    FAILED = "FAILED",
    COMPLETED = "COMPLETED",
}

@Entity("client_followups")
export class ClientFollowup extends Model {
    @ManyToOne(() => Clients, (client) => client.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "client_id" })
    client: Clients;

    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "user_id" })
    user: User | null;

    @Column({
        type: "enum",
        enum: ClientFollowupStatus,
        default: ClientFollowupStatus.PENDING,
    })
    status: ClientFollowupStatus;

    @Column({ type: "timestamp", nullable: true })
    due_date: Date;

    @Column({ type: "timestamp", nullable: true })
    completed_date: Date;

    @Column({ type: "text", nullable: true })
    remarks: string;
}
