import { IsOptional, IsString, MaxLength } from 'class-validator';

export class QueryClientsDto {
  // Part of the client name, case-insensitive
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
