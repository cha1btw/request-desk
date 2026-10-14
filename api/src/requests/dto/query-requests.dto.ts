import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { RequestFiltersDto } from './request-filters.dto';

// The filters plus the page to show. Query strings are text, so @Type turns "2" into 2.
export class QueryRequestsDto extends RequestFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
