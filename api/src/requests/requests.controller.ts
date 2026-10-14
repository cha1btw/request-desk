import { Body, Controller, Get, Header, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { QueryRequestsDto } from './dto/query-requests.dto';
import { RequestFiltersDto } from './dto/request-filters.dto';
import { RequestStatsQueryDto } from './dto/request-stats-query.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestsService } from './requests.service';

// Any logged-in user (admin or manager) can use these routes.
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  findAll(@Query() query: QueryRequestsDto) {
    return this.requestsService.findPage(query);
  }

  // This route and the next one must be declared before @Get(':id'),
  // otherwise "stats" and "export" would be read as ids.
  @Get('stats')
  countByStatus(@Query() query: RequestStatsQueryDto) {
    return this.requestsService.countByStatus(query);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="requests.csv"')
  exportCsv(@Query() filters: RequestFiltersDto) {
    return this.requestsService.exportCsv(filters);
  }

  @Post()
  create(@Body() dto: CreateRequestDto) {
    return this.requestsService.create(dto);
  }

  // ParseIntPipe turns "12" into 12 and answers 400 for "abc".
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRequestDto) {
    return this.requestsService.update(id, dto);
  }

  @Post(':id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.requestsService.addComment(id, user.id, dto);
  }
}
