import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { escapeLike } from '../common/escape-like';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(@InjectRepository(Client) private readonly clients: Repository<Client>) {}

  findAll(search?: string): Promise<Client[]> {
    const name = search?.trim();
    return this.clients.find({
      where: name ? { name: ILike(`%${escapeLike(name)}%`) } : {},
      order: { name: 'ASC' },
    });
  }

  findById(id: number): Promise<Client | null> {
    return this.clients.findOneBy({ id });
  }

  create(dto: CreateClientDto): Promise<Client> {
    return this.clients.save(this.clients.create(dto));
  }
}
