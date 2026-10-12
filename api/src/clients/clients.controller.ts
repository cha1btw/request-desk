import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';

// Any logged-in user (admin or manager) can use these routes.
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll(@Query() query: QueryClientsDto) {
    return this.clientsService.findAll(query.search);
  }

  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }
}
