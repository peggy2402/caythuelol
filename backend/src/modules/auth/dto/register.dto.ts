import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'proplayer2026' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'player@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'CUSTOMER', required: false })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ example: '0987654321', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

