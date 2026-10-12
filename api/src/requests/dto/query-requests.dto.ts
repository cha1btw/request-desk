import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RequestStatus } from '../request-status.enum';

export class QueryRequestsDto {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  // Part of the client name, case-insensitive
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientName?: string;
}
