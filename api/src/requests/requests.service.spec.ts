import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientsService } from '../clients/clients.service';
import { CustomerRequest } from './customer-request.entity';
import { RequestComment } from './request-comment.entity';
import { RequestStatus } from './request-status.enum';
import { RequestsService } from './requests.service';

describe('RequestsService', () => {
  let service: RequestsService;

  // The query builder is a chain of calls that each return the builder itself.
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  const requestsRepo = {
    createQueryBuilder: jest.fn(() => queryBuilder),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
    create: jest.fn((data: Partial<CustomerRequest>) => data),
    save: jest.fn((data: Partial<CustomerRequest>) => Promise.resolve({ id: 10, ...data })),
  };
  const commentsRepo = {
    create: jest.fn((data: Partial<RequestComment>) => data),
    save: jest.fn((data: Partial<RequestComment>) => Promise.resolve({ id: 99, ...data })),
    findOneOrFail: jest.fn(),
  };
  const clientsService = { findById: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: getRepositoryToken(CustomerRequest), useValue: requestsRepo },
        { provide: getRepositoryToken(RequestComment), useValue: commentsRepo },
        { provide: ClientsService, useValue: clientsService },
      ],
    }).compile();
    service = moduleRef.get(RequestsService);
  });

  describe('findAll', () => {
    it('adds no filters when the query is empty', async () => {
      await service.findAll({});
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('filters by status and by client name together', async () => {
      await service.findAll({ status: RequestStatus.Done, clientName: ' ann ' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('request.status = :status', {
        status: RequestStatus.Done,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('client.name ILIKE :clientName', {
        clientName: '%ann%',
      });
    });
  });

  describe('findOne', () => {
    it('throws 404 for an unknown id', async () => {
      requestsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(5)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { title: 'Fix the door', description: 'It does not close', clientId: 3 };

    it('rejects a client that does not exist', async () => {
      clientsService.findById.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(requestsRepo.save).not.toHaveBeenCalled();
    });

    it('saves the request and returns it with its relations', async () => {
      clientsService.findById.mockResolvedValue({ id: 3 });
      requestsRepo.findOne.mockResolvedValue({ id: 10, ...dto, status: RequestStatus.New });

      const result = await service.create(dto);

      expect(requestsRepo.save).toHaveBeenCalledWith(dto);
      expect(requestsRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 10 } }));
      expect(result.status).toBe(RequestStatus.New);
    });
  });

  describe('update', () => {
    it('throws 404 for an unknown id', async () => {
      requestsRepo.findOneBy.mockResolvedValue(null);
      await expect(service.update(5, { status: RequestStatus.Done })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('changes only the fields that were sent', async () => {
      requestsRepo.findOneBy.mockResolvedValue({ id: 5, title: 'Old', status: RequestStatus.New });
      requestsRepo.findOne.mockResolvedValue({ id: 5 });

      await service.update(5, { status: RequestStatus.InProgress });

      expect(requestsRepo.save).toHaveBeenCalledWith({
        id: 5,
        title: 'Old',
        status: RequestStatus.InProgress,
      });
    });

    it('rejects a new client that does not exist', async () => {
      requestsRepo.findOneBy.mockResolvedValue({ id: 5 });
      clientsService.findById.mockResolvedValue(null);

      await expect(service.update(5, { clientId: 77 })).rejects.toBeInstanceOf(BadRequestException);
      expect(requestsRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('addComment', () => {
    it('throws 404 when the request does not exist', async () => {
      requestsRepo.existsBy.mockResolvedValue(false);
      await expect(service.addComment(5, 1, { text: 'Hi' })).rejects.toBeInstanceOf(NotFoundException);
      expect(commentsRepo.save).not.toHaveBeenCalled();
    });

    it('saves the comment with the logged-in user as author', async () => {
      requestsRepo.existsBy.mockResolvedValue(true);
      commentsRepo.findOneOrFail.mockResolvedValue({ id: 99, text: 'Called the client' });

      await service.addComment(5, 2, { text: 'Called the client' });

      expect(commentsRepo.save).toHaveBeenCalledWith({
        requestId: 5,
        authorId: 2,
        text: 'Called the client',
      });
    });
  });
});
