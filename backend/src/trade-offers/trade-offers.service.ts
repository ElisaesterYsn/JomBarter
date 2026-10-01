import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeOfferDto } from './dto/create-trade-offer.dto';

// Offer statuses — matches schema comment
export const OFFER_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

/** Fields included on every offer query */
const OFFER_INCLUDE = {
  sender: { select: { id: true, displayName: true, username: true, profileImage: true } },
  receiver: { select: { id: true, displayName: true, username: true, profileImage: true } },
  targetListing: {
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  },
  offeredItems: {
    include: {
      listing: {
        include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
      },
    },
  },
} as const;

@Injectable()
export class TradeOffersService {
  private readonly logger = new Logger(TradeOffersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Create offer ──────────────────────────────────────────────────────────

  async create(senderId: string, dto: CreateTradeOfferDto) {
    const { targetListingId, offeredListingId, message } = dto;

    // 1. Target listing must exist and be ACTIVE
    const targetListing = await this.prisma.listing.findUnique({
      where: { id: targetListingId },
    });
    if (!targetListing) throw new NotFoundException('Target listing not found');
    if (targetListing.status !== 'ACTIVE') {
      throw new BadRequestException('This listing is no longer available for barter');
    }

    // 2. Cannot offer on your own listing
    if (targetListing.userId === senderId) {
      throw new BadRequestException('You cannot make an offer on your own listing');
    }

    // 3. Offered listing must exist, be ACTIVE, and belong to the sender
    const offeredListing = await this.prisma.listing.findUnique({
      where: { id: offeredListingId },
    });
    if (!offeredListing) throw new NotFoundException('Offered listing not found');
    if (offeredListing.userId !== senderId) {
      throw new ForbiddenException('You can only offer your own listings');
    }
    if (offeredListing.status !== 'ACTIVE') {
      throw new BadRequestException('The listing you are offering must be active/published');
    }
    if (offeredListing.id === targetListingId) {
      throw new BadRequestException('You cannot offer the same listing you are targeting');
    }

    // 4. No duplicate pending offer for same pair
    const existing = await this.prisma.tradeOffer.findFirst({
      where: {
        senderId,
        targetListingId,
        status: 'PENDING',
        offeredItems: { some: { listingId: offeredListingId } },
      },
    });
    if (existing) {
      throw new BadRequestException('You already have a pending offer for this listing');
    }

    // 5. Create offer + item in a transaction
    const offer = await this.prisma.$transaction(async (tx) => {
      const newOffer = await tx.tradeOffer.create({
        data: {
          senderId,
          receiverId: targetListing.userId,
          targetListingId,
          message: message ?? null,
          status: 'PENDING',
        },
      });
      await tx.tradeOfferItem.create({
        data: { tradeOfferId: newOffer.id, listingId: offeredListingId },
      });
      return newOffer;
    });

    return this.findOne(offer.id);
  }

  // ── Get received offers ───────────────────────────────────────────────────

  async findReceived(userId: string) {
    return this.prisma.tradeOffer.findMany({
      where: { receiverId: userId },
      include: OFFER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Get sent offers ───────────────────────────────────────────────────────

  async findSent(userId: string) {
    return this.prisma.tradeOffer.findMany({
      where: { senderId: userId },
      include: OFFER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Get single offer ──────────────────────────────────────────────────────

  async findOne(id: string) {
    const offer = await this.prisma.tradeOffer.findUnique({
      where: { id },
      include: OFFER_INCLUDE,
    });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  // ── Accept offer ──────────────────────────────────────────────────────────

  async accept(id: string, userId: string) {
    const offer = await this.assertOfferExists(id);
    if (offer.receiverId !== userId) throw new ForbiddenException('Not your offer to accept');
    if (offer.status !== 'PENDING') {
      throw new BadRequestException(`Offer is already ${offer.status}`);
    }

    // Accept + create Trade record in a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.tradeOffer.update({
        where: { id },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      });
      await tx.trade.create({
        data: { tradeOfferId: id, status: 'ACTIVE' },
      });
      // Reject all other pending offers for the same target listing
      await tx.tradeOffer.updateMany({
        where: {
          targetListingId: offer.targetListingId,
          status: 'PENDING',
          id: { not: id },
        },
        data: { status: 'REJECTED', respondedAt: new Date() },
      });
    });

    return this.findOne(id);
  }

  // ── Reject offer ──────────────────────────────────────────────────────────

  async reject(id: string, userId: string) {
    const offer = await this.assertOfferExists(id);
    if (offer.receiverId !== userId) throw new ForbiddenException('Not your offer to reject');
    if (offer.status !== 'PENDING') {
      throw new BadRequestException(`Offer is already ${offer.status}`);
    }

    await this.prisma.tradeOffer.update({
      where: { id },
      data: { status: 'REJECTED', respondedAt: new Date() },
    });
    return this.findOne(id);
  }

  // ── Cancel offer (sender only) ────────────────────────────────────────────

  async cancel(id: string, userId: string) {
    const offer = await this.assertOfferExists(id);
    if (offer.senderId !== userId) throw new ForbiddenException('Not your offer to cancel');
    if (!['PENDING', 'ACCEPTED'].includes(offer.status)) {
      throw new BadRequestException(`Offer cannot be cancelled (status: ${offer.status})`);
    }

    await this.prisma.tradeOffer.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return this.findOne(id);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async assertOfferExists(id: string) {
    const offer = await this.prisma.tradeOffer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }
}
