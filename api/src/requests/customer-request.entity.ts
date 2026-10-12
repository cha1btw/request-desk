import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { RequestComment } from './request-comment.entity';
import { RequestStatus } from './request-status.enum';

// Named CustomerRequest (not Request) to avoid a clash with the built-in
// Request type. The table is still called "requests".
@Entity('requests')
export class CustomerRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Index('IDX_requests_status')
  @Column({ type: 'enum', enum: RequestStatus, enumName: 'request_status', default: RequestStatus.New })
  status: RequestStatus;

  // The foreign key column and the relation below point at the same database column.
  @Index('IDX_requests_client_id')
  @Column({ name: 'client_id' })
  clientId: number;

  @ManyToOne(() => Client, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => RequestComment, (comment) => comment.request)
  comments: RequestComment[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
