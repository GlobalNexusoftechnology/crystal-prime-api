import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";
import { Ticket } from "./ticket.entity";
import { User } from "./user.entity";

@Entity('ticket_comments')
export class TicketComment extends Model {
    @ManyToOne(() => Ticket, (ticket) => ticket.id, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ticket_id' })
    ticket: Ticket;

    @ManyToOne(() => User, (user) => user.id, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 255, nullable: true })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 50, default: 'Open' })
    status: string;

    @Column({ type: 'varchar', length: 50, default: 'Medium' })
    priority: string;

    @Column({ type: 'text', nullable: true })
    remark: string;
}
