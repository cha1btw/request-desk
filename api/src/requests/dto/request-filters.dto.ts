import { IsEnum, IsOptional } from 'class-validator';
import { RequestStatus } from '../request-status.enum';
import { RequestStatsQueryDto } from './request-stats-query.dto';

// Filters for the list: the client name search (inherited) plus the status.
export class RequestFiltersDto extends RequestStatsQueryDto {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;
}
