import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '../clients/clients.module';
import { CustomerRequest } from './customer-request.entity';
import { RequestComment } from './request-comment.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerRequest, RequestComment]), ClientsModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
