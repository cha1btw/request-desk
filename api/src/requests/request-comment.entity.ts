import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { CustomerRequest } from './customer-request.entity';

@Entity('comments')
export class RequestComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  text: string;

  @Index('IDX_comments_request_id')
  @Column({ name: 'request_id' })
  requestId: number;

  @ManyToOne(() => CustomerRequest, (request) => request.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: CustomerRequest;

  @Column({ name: 'author_id' })
  authorId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
