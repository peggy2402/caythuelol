import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BoostersService } from './boosters.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ReqUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../database/schemas/User';

@ApiTags('Boosters')
@Controller('boosters')
export class BoostersController {
  constructor(private boostersService: BoostersService) {}

  @Public()
  @Get('marketplace/services')
  @ApiOperation({ summary: 'List marketplace services across all boosters' })
  async listMarketplaceServices(@Query() query: any) {
    return this.boostersService.listMarketplaceServices(query);
  }

  @Public()
  @Get('marketplace/services/:serviceId')
  @ApiOperation({ summary: 'Get marketplace service detail by ID' })
  async getServiceDetail(@Param('serviceId') serviceId: string) {
    return this.boostersService.getServiceDetail(serviceId);
  }

  @Public()
  @Get('service-types')
  @ApiOperation({ summary: 'Get available service templates for a game' })
  async getServiceTypes(@Query('gameCode') gameCode?: string) {
    return this.boostersService.getAvailableServiceTypes(gameCode);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List boosters with filters & pagination' })
  async listBoosters(@Query() query: any) {
    return this.boostersService.listBoosters(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BOOSTER)
  @ApiBearerAuth()
  @Patch('availability')
  @ApiOperation({ summary: 'Toggle booster availability (isReady)' })
  async toggleAvailability(@ReqUser() user: any, @Body('isReady') isReady: boolean) {
    return this.boostersService.toggleAvailability(user.userId, isReady);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BOOSTER)
  @ApiBearerAuth()
  @Get('market')
  @ApiOperation({ summary: 'Get job market available orders' })
  async getJobMarket(@ReqUser() user: any) {
    return this.boostersService.getJobMarket(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BOOSTER)
  @ApiBearerAuth()
  @Get('my-orders')
  @ApiOperation({ summary: 'Get current booster orders' })
  async getMyOrders(@ReqUser() user: any, @Query('status') status?: string) {
    return this.boostersService.getMyOrders(user.userId, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BOOSTER)
  @ApiBearerAuth()
  @Get('services')
  @ApiOperation({ summary: 'Get booster service pricing settings' })
  async getServiceSettings(@ReqUser() user: any) {
    return this.boostersService.getServiceSettings(user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BOOSTER)
  @ApiBearerAuth()
  @Post('services')
  @ApiOperation({ summary: 'Update booster service pricing settings' })
  async saveServiceSettings(@ReqUser() user: any, @Body() body: any) {
    return this.boostersService.saveServiceSettings(user.userId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BOOSTER)
  @ApiBearerAuth()
  @Get('stats')
  @ApiOperation({ summary: 'Get booster earnings and order stats' })
  async getStats(@ReqUser() user: any) {
    return this.boostersService.getStats(user.userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get booster profile by ID or username' })
  async getBoosterById(@Param('id') id: string): Promise<any> {
    return this.boostersService.getBoosterById(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('become-booster')
  @ApiOperation({ summary: 'Register and upgrade role to BOOSTER' })
  async becomeBooster(@ReqUser() user: any, @Body() body: any) {
    return this.boostersService.becomeBooster(user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('apply')
  @ApiOperation({ summary: 'Submit booster application' })
  async apply(@ReqUser() user: any, @Body() body: any) {
    return this.boostersService.apply(user.userId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BOOSTER)
  @ApiBearerAuth()
  @Post('resign')
  @ApiOperation({ summary: 'Voluntarily resign booster role' })
  async resign(@ReqUser() user: any) {
    return this.boostersService.resign(user.userId);
  }
}

