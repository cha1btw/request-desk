import { IsOptional, IsString, MaxLength } from 'class-validator';

// The only filter the status counters understand.
export class RequestStatsQueryDto {
  // Part of the client name, case-insensitive
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientName?: string;
}
