import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RiotPlayerLookupDto {
  @ApiPropertyOptional({
    example: 'VN',
    description: 'Mã máy chủ Riot Games (VN, KR, JP, NA, EUW, EUNE, OC...)',
    default: 'VN',
  })
  @IsString()
  @IsOptional()
  server?: string;

  @ApiProperty({
    example: 'Mary Tái Lâm#2003',
    description: 'Riot ID đầy đủ kèm Tagline (ví dụ: Faker#KR1, Player#VN2, Mary Tái Lâm#2003)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Mary Tái Lâm',
    description: 'Tên nhân vật Game Name (nếu không gộp chung vào trường name)',
  })
  @IsString()
  @IsOptional()
  gameName?: string;

  @ApiPropertyOptional({
    example: '2003',
    description: 'Tagline sau dấu # (nếu không gộp chung vào trường name)',
  })
  @IsString()
  @IsOptional()
  tagLine?: string;
}

export class RiotMatchLookupDto {
  @ApiProperty({
    example: 'VN2_1640656388',
    description: 'Mã trận đấu Riot Match ID (ví dụ: VN2_1640656388 hoặc 1640656388)',
  })
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @ApiPropertyOptional({
    example: 'VN',
    description: 'Mã máy chủ Riot Games (VN, KR, NA, EUW...)',
    default: 'VN',
  })
  @IsString()
  @IsOptional()
  server?: string;

  @ApiPropertyOptional({
    example: 'Mary Tái Lâm#2003',
    description: 'Tên Ingame (Riot ID) của người chơi trong trận để trích xuất KDA, Tướng và Rank LP',
  })
  @IsString()
  @IsOptional()
  targetName?: string;
}
