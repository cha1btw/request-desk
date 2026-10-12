import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from '../clients/clients.service';
import { escapeLike } from '../common/escape-like';
import { CustomerRequest } from './customer-request.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { QueryRequestsDto } from './dto/query-requests.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestComment } from './request-comment.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(CustomerRequest) private readonly requests: Repository<CustomerRequest>,
    @InjectRepository(RequestComment) private readonly comments: Repository<RequestComment>,
    private readonly clientsService: ClientsService,
  ) {}

  // Newest first. Each filter is optional and they combine with AND.
  findAll(query: QueryRequestsDto): Promise<CustomerRequest[]> {
    const qb = this.requests
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.client', 'client')
      .orderBy('request.createdAt', 'DESC')
      .addOrderBy('request.id', 'DESC');

    if (query.status) {
      qb.andWhere('request.status = :status', { status: query.status });
    }
    const clientName = query.clientName?.trim();
    if (clientName) {
      qb.andWhere('client.name ILIKE :clientName', { clientName: `%${escapeLike(clientName)}%` });
    }
    return qb.getMany();
  }

  // One request with its client and its comments (oldest first, with authors).
  async findOne(id: number): Promise<CustomerRequest> {
    const request = await this.requests.findOne({
      where: { id },
      relations: { client: true, comments: { author: true } },
      order: { comments: { createdAt: 'ASC', id: 'ASC' } },
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  async create(dto: CreateRequestDto): Promise<CustomerRequest> {
    await this.assertClientExists(dto.clientId);
    const saved = await this.requests.save(this.requests.create(dto));
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateRequestDto): Promise<CustomerRequest> {
    // Loaded without relations on purpose: with a loaded `client` object,
    // TypeORM would ignore a new `clientId`.
    const request = await this.requests.findOneBy({ id });
    if (!request) throw new NotFoundException('Request not found');

    if (dto.clientId !== undefined) {
      await this.assertClientExists(dto.clientId);
    }
    await this.requests.save(Object.assign(request, dto));
    return this.findOne(id);
  }

  async addComment(requestId: number, authorId: number, dto: CreateCommentDto): Promise<RequestComment> {
    if (!(await this.requests.existsBy({ id: requestId }))) {
      throw new NotFoundException('Request not found');
    }
    const saved = await this.comments.save(
      this.comments.create({ requestId, authorId, text: dto.text }),
    );
    return this.comments.findOneOrFail({ where: { id: saved.id }, relations: { author: true } });
  }

  private async assertClientExists(clientId: number): Promise<void> {
    if (!(await this.clientsService.findById(clientId))) {
      throw new BadRequestException(`Client ${clientId} does not exist`);
    }
  }
}
