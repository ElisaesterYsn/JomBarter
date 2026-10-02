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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

  /** Send a new trade offer */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a trade offer for a listing' })
  @ApiResponse({ status: 201, description: 'Offer created' })
  @ApiResponse({ status: 403, description: 'Forbidden — cannot offer own listing' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  @ApiResponse({ status: 409, description: 'Conflict — duplicate or unavailable' })
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateTradeOfferDto) {
    const offer = await this.tradeOffersService.create(user.id, dto);
    return { message: 'Offer sent', offer };
  }

  /** Offers received by the authenticated user */
  @Get('received')
  @ApiOperation({ summary: 'Get offers received by the authenticated user' })
  async getReceived(@CurrentUser() user: JwtUser) {
    const offers = await this.tradeOffersService.findReceived(user.id);
    return { offers };
  }

  /** Offers sent by the authenticated user */
  @Get('sent')
  @ApiOperation({ summary: 'Get offers sent by the authenticated user' })
  async getSent(@CurrentUser() user: JwtUser) {
    const offers = await this.tradeOffersService.findSent(user.id);
    return { offers };
  }

  /** Single offer — only sender or receiver may view */
  @Get(':id')
  @ApiOperation({ summary: 'Get a single trade offer by id' })
  @ApiResponse({ status: 403, description: 'Not a party to this offer' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  async getOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const offer = await this.tradeOffersService.findOne(id);
    if (offer.senderId !== user.id && offer.receiverId !== user.id) {
      throw new ForbiddenException('You are not a party to this offer');
    }
    return { offer };
  }

  // ── Status transitions ────────────────────────────────────────────────────

  /**
   * PENDING → ACCEPTED  (receiver only)
   * Creates a Trade record; declines all other pending offers for the same listing.
   */
  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept a trade offer (receiver only)' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async accept(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const offer = await this.tradeOffersService.accept(id, user.id);
    return { message: 'Offer accepted', offer };
  }

  /**
   * PENDING → DECLINED  (receiver only)
   */
  @Patch(':id/decline')
  @ApiOperation({ summary: 'Decline a trade offer (receiver only)' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async decline(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const offer = await this.tradeOffersService.decline(id, user.id);
    return { message: 'Offer declined', offer };
  }

  /**
   * PENDING → WITHDRAWN  (sender only)
   */
  @Patch(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw a trade offer (sender only)' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async withdraw(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const offer = await this.tradeOffersService.withdraw(id, user.id);
    return { message: 'Offer withdrawn', offer };
  }

  /**
   * ACCEPTED → COMPLETED  (sender or receiver)
   * Marks the trade as physically completed; listing becomes TRADED.
   */
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark an accepted trade as completed (either participant)' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async complete(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const offer = await this.tradeOffersService.complete(id, user.id);
    return { message: 'Trade completed', offer };
  }
}
