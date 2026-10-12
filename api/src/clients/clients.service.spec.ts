import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike } from 'typeorm';
import { Client } from './client.entity';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let service: ClientsService;
  const repo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((data: Partial<Client>) => data),
    save: jest.fn((data: Partial<Client>) => Promise.resolve({ id: 1, ...data })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [ClientsService, { provide: getRepositoryToken(Client), useValue: repo }],
    }).compile();
    service = moduleRef.get(ClientsService);
  });

  it('lists all clients sorted by name when there is no search', async () => {
    await service.findAll();
    expect(repo.find).toHaveBeenCalledWith({ where: {}, order: { name: 'ASC' } });
  });

  it('searches by part of the name, case-insensitive', async () => {
    await service.findAll('  ann ');
    expect(repo.find).toHaveBeenCalledWith({
      where: { name: ILike('%ann%') },
      order: { name: 'ASC' },
    });
  });

  it('treats % in the search text literally', async () => {
    await service.findAll('50%');
    expect(repo.find).toHaveBeenCalledWith({
      where: { name: ILike('%50\\%%') },
      order: { name: 'ASC' },
    });
  });

  it('creates a client', async () => {
    const dto = { name: 'Anna', email: 'anna@example.com', phone: '+380441234567' };
    await expect(service.create(dto)).resolves.toEqual({ id: 1, ...dto });
    expect(repo.save).toHaveBeenCalledWith(dto);
  });
});
