import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ClientsService } from '../clients/clients.service';
import { escapeLike } from '../common/escape-like';
import type { Page } from '../common/page';
import { requestsToCsv } from './csv';
import { CustomerRequest } from './customer-request.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { QueryRequestsDto } from './dto/query-requests.dto';
import { RequestFiltersDto } from './dto/request-filters.dto';
import { RequestStatsQueryDto } from './dto/request-stats-query.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestComment } from './request-comment.entity';
import { RequestStatus } from './request-status.enum';

const DEFAULT_PAGE_SIZE = 20;

// How many requests are in each status, plus the total.
export type StatusCounts = Record<RequestStatus, number> & { total: number };

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(CustomerRequest) private readonly requests: Repository<CustomerRequest>,
    @InjectRepository(RequestComment) private readonly comments: Repository<RequestComment>,
    private readonly clientsService: ClientsService,
  ) {}

  // Newest first. Each filter is optional and they combine with AND.
  // The list, the CSV export (and later the page counts) all build on this one query.
  private filteredQuery(filters: RequestFiltersDto) {
    const qb = this.requests
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.client', 'client')
      .orderBy('request.createdAt', 'DESC')
      .addOrderBy('request.id', 'DESC');

    if (filters.status) {
      qb.andWhere('request.status = :status', { status: filters.status });
    }
    this.filterByClientName(qb, filters.clientName);
    return qb;
  }

  // Part of the client name, case-insensitive. `qb` must join the client as "client".
  private filterByClientName(qb: SelectQueryBuilder<CustomerRequest>, search: string | undefined): void {
    const clientName = search?.trim();
    if (clientName) {
      qb.andWhere('client.name ILIKE :clientName', { clientName: `%${escapeLike(clientName)}%` });
    }
  }

  // One page of the list, plus the total so the UI can show "page 2 of 5".
  async findPage(query: QueryRequestsDto): Promise<Page<CustomerRequest>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    const [items, total] = await this.filteredQuery(query)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { items, total, page, pageSize };
  }

  // Everything that matches, without paging (used by the CSV export).
  findAll(filters: RequestFiltersDto): Promise<CustomerRequest[]> {
    return this.filteredQuery(filters).getMany();
  }

  // The same list and filters as findAll(), as CSV text.
  async exportCsv(filters: RequestFiltersDto): Promise<string> {
    return requestsToCsv(await this.findAll(filters));
  }

  // Numbers for the status filter buttons. The status filter itself is not
  // applied here, otherwise choosing "Done" would turn the other counters into 0.
  async countByStatus(query: RequestStatsQueryDto): Promise<StatusCounts> {
    const qb = this.requests
      .createQueryBuilder('request')
      .leftJoin('request.client', 'client')
      .select('request.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.status');
    this.filterByClientName(qb, query.clientName);

    const rows = await qb.getRawMany<{ status: RequestStatus; count: string }>();

    // A status with no requests has no row in the result, so start from zeros.
    const counts: StatusCounts = { new: 0, in_progress: 0, done: 0, total: 0 };
    for (const row of rows) {
      counts[row.status] = Number(row.count); // COUNT comes back from Postgres as text
      counts.total += Number(row.count);
    }
    return counts;
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

  // The comments go with it: the database deletes them (ON DELETE CASCADE).
  async remove(id: number): Promise<void> {
    const result = await this.requests.delete({ id });
    if (!result.affected) throw new NotFoundException('Request not found');
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
