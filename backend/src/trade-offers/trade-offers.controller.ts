import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TradeOffersService } from './trade-offers.service';
import { CreateTradeOfferDto } from './dto/create-trade-offer.dto';

interface JwtUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
}

@ApiTags('trade-offers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trade-offers')
export class TradeOffersController {
  constructor(private readonly tradeOffersService: TradeOffersService) {}

  /** Create a new trade offer */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a trade offer for a listing' })
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateTradeOfferDto) {
    const offer = await this.tradeOffersService.create(user.id, dto);
    return { message: 'Offer sent', offer };
  }

  /** Get offers received by the authenticated user */
  @Get('received')
  @ApiOperation({ summary: 'Get offers received by the authenticated user' })
  async getReceived(@CurrentUser() user: JwtUser) {
    const offers = await this.tradeOffersService.findReceived(user.id);
    return { offers };
  }

  /** Get offers sent by the authenticated user */
  @Get('sent')
  @ApiOperation({ summary: 'Get offers sent by the authenticated user' })
  async getSent(@CurrentUser() user: JwtUser) {
    const offers = await this.tradeOffersService.findSent(user.id);
    return { offers };
  }

  /** Get a single offer */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single trade offer by id' })
  async getOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const offer = await this.tradeOffersService.findOne(id);
    // Only sender or receiver may view it
    if (offer.senderId !== user.id && offer.receiverId !== user.id) {
      throw new ForbiddenException('You are not a party to this offer');
    }
    return { offer };
  }

  /** Accept an offer (receiver only) */
  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept a trade offer' })
  async accept(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const offer = await this.tradeOffersService.accept(id, user.id);
    return { message: 'Offer accepted', offer };
  }

  /** Reject an offer (receiver only) */
  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a trade offer' })
  async reject(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const offer = await this.tradeOffersService.reject(id, user.id);
    return { message: 'Offer rejected', offer };
  }

  /** Cancel an offer (sender only) */
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a trade offer' })
  async cancel(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const offer = await this.tradeOffersService.cancel(id, user.id);
    return { message: 'Offer cancelled', offer };
  }
}
