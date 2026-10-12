import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateClientDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  // Digits, spaces and + ( ) - only, e.g. "+380 44 123 45 67"
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^[+\d\s()-]{5,30}$/, { message: 'phone must contain only digits, spaces and + ( ) -' })
  phone: string;
}
