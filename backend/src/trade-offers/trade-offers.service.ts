import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeOfferDto } from './dto/create-trade-offer.dto';

// ── Status constants ──────────────────────────────────────────────────────────
// These are the canonical status values stored in the database.
// DECLINED  = recipient rejected the offer  (was: REJECTED)
// WITHDRAWN = sender cancelled before acceptance (was: CANCELLED)
// COMPLETED = trade physically completed after ACCEPTED
export const OFFER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'WITHDRAWN',
  'COMPLETED',
  'EXPIRED',
] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

// Valid transitions enforced on the backend
// { from: Set<to> }
const VALID_TRANSITIONS: Record<string, readonly string[]> = {
  PENDING: ['ACCEPTED', 'DECLINED', 'WITHDRAWN'],
  ACCEPTED: ['COMPLETED'],
  DECLINED: [],
  WITHDRAWN: [],
  COMPLETED: [],
  EXPIRED: [],
};

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

  // ── Create ────────────────────────────────────────────────────────────────

  async create(senderId: string, dto: CreateTradeOfferDto) {
    const { targetListingId, offeredListingId, message } = dto;

    // 1. Target listing must exist and be ACTIVE
    const targetListing = await this.prisma.listing.findUnique({
      where: { id: targetListingId },
    });
    if (!targetListing) throw new NotFoundException('Target listing not found');
    if (targetListing.status !== 'ACTIVE') {
      throw new ConflictException('This listing is no longer available for barter');
    }

    // 2. Cannot offer on your own listing
    if (targetListing.userId === senderId) {
      throw new ConflictException('You cannot make an offer on your own listing');
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
      throw new ConflictException('The listing you are offering must be active/published');
    }
    if (offeredListing.id === targetListingId) {
      throw new ConflictException('You cannot offer the same listing you are targeting');
    }

    // 4. No duplicate PENDING offer for same pair
    const existing = await this.prisma.tradeOffer.findFirst({
      where: {
        senderId,
        targetListingId,
        status: 'PENDING',
        offeredItems: { some: { listingId: offeredListingId } },
      },
    });
    if (existing) {
      throw new ConflictException('You already have a pending offer for this listing');
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

  // ── Queries ───────────────────────────────────────────────────────────────

  async findReceived(userId: string) {
    return this.prisma.tradeOffer.findMany({
      where: { receiverId: userId },
      include: OFFER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSent(userId: string) {
    return this.prisma.tradeOffer.findMany({
      where: { senderId: userId },
      include: OFFER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const offer = await this.prisma.tradeOffer.findUnique({
      where: { id },
      include: OFFER_INCLUDE,
    });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  // ── Accept (PENDING → ACCEPTED) ───────────────────────────────────────────
  // Receiver only. Creates Trade record and rejects competing PENDING offers.

  async accept(id: string, userId: string) {
    const offer = await this.loadAndAuthorize(id, userId, 'receiver');
    this.assertTransition(offer.status, 'ACCEPTED');

    await this.prisma.$transaction(async (tx) => {
      await tx.tradeOffer.update({
        where: { id },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      });
      // Create Trade record (status ACTIVE)
      await tx.trade.create({ data: { tradeOfferId: id, status: 'ACTIVE' } });
      // Decline all other PENDING offers for the same target listing
      await tx.tradeOffer.updateMany({
        where: {
          targetListingId: offer.targetListingId,
          status: 'PENDING',
          id: { not: id },
        },
        data: { status: 'DECLINED', respondedAt: new Date() },
      });
    });

    return this.findOne(id);
  }

  // ── Decline (PENDING → DECLINED) ─────────────────────────────────────────
  // Receiver only.

  async decline(id: string, userId: string) {
    const offer = await this.loadAndAuthorize(id, userId, 'receiver');
    this.assertTransition(offer.status, 'DECLINED');

    await this.prisma.tradeOffer.update({
      where: { id },
      data: { status: 'DECLINED', respondedAt: new Date() },
    });
    return this.findOne(id);
  }

  // ── Withdraw (PENDING → WITHDRAWN) ───────────────────────────────────────
  // Sender only. Can only withdraw a PENDING offer.

  async withdraw(id: string, userId: string) {
    const offer = await this.loadAndAuthorize(id, userId, 'sender');
    this.assertTransition(offer.status, 'WITHDRAWN');

    await this.prisma.tradeOffer.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    });
    return this.findOne(id);
  }

  // ── Complete (ACCEPTED → COMPLETED) ──────────────────────────────────────
  // Either participant can mark the trade as physically completed.

  async complete(id: string, userId: string) {
    const offer = await this.loadAndAuthorize(id, userId, 'participant');
    this.assertTransition(offer.status, 'COMPLETED');

    await this.prisma.$transaction(async (tx) => {
      // Update offer status
      await tx.tradeOffer.update({
        where: { id },
        data: { status: 'COMPLETED', respondedAt: new Date() },
      });
      // Update the linked Trade record
      await tx.trade.updateMany({
        where: { tradeOfferId: id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      // Mark the target listing as TRADED so it leaves the public feed
      await tx.listing.update({
        where: { id: offer.targetListingId },
        data: { status: 'TRADED' },
      });
    });

    return this.findOne(id);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Load an offer and verify the caller is authorized for the requested role.
   * Throws 404 if the offer doesn't exist, 403 if the caller is not authorized.
   */
  private async loadAndAuthorize(
    id: string,
    userId: string,
    role: 'sender' | 'receiver' | 'participant',
  ) {
    const offer = await this.prisma.tradeOffer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found');

    if (role === 'sender' && offer.senderId !== userId) {
      throw new ForbiddenException('Only the sender can perform this action');
    }
    if (role === 'receiver' && offer.receiverId !== userId) {
      throw new ForbiddenException('Only the recipient can perform this action');
    }
    if (role === 'participant' && offer.senderId !== userId && offer.receiverId !== userId) {
      throw new ForbiddenException('Only trade participants can perform this action');
    }

    return offer;
  }

  /**
   * Verify that a transition from `currentStatus` to `nextStatus` is valid.
   * Throws 409 Conflict if the transition is not allowed.
   */
  private assertTransition(currentStatus: string, nextStatus: string) {
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new ConflictException(`Cannot transition offer from ${currentStatus} to ${nextStatus}`);
    }
  }
}
