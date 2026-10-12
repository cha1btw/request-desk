import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsInt()
  @Min(1)
  clientId: number;
}
