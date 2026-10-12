import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminListingsQueryDto } from './dto/admin-listings-query.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';

// ── Safe admin user projection ─────────────────────────────────────────────
// Excludes passwordHash from all admin responses
const USER_SELECT = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  profileImage: true,
  bio: true,
  location: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface AdminUserSummary {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profileImage: string | null;
  role: string;
  status: string;
  createdAt: Date;
  listingCount: number;
  activeListingCount: number;
  offersSentCount: number;
  offersReceivedCount: number;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profileImage: string | null;
  bio: string | null;
  location: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  listingCount: number;
  activeListingCount: number;
  offersSentCount: number;
  offersReceivedCount: number;
  completedTradeCount: number;
}

// ── Listing-related interfaces ─────────────────────────────────────────────

export interface AdminListingSummary {
  id: string;
  title: string;
  status: string;
  condition: string;
  estimatedValue: number | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    displayName: string;
    username: string;
    profileImage: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    imageUrl: string | null;
    videoUrl: string | null;
  }>;
}

export interface AdminListingDetail {
  id: string;
  title: string;
  description: string;
  listingType: string;
  condition: string;
  status: string;
  estimatedValue: number | null;
  location: string | null;
  lookingFor: string | null;
  tradePreference: string | null;
  exchangeMethod: string | null;
  interestedInCategories: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    email: string;
    displayName: string;
    username: string;
    profileImage: string | null;
    status: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    imageUrl: string | null;
    videoUrl: string | null;
    sortOrder: number;
  }>;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      totalListings,
      activeListings,
      draftListings,
      totalOffers,
      pendingOffers,
      completedTrades,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count({ where: { status: 'BANNED' } }),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.listing.count({ where: { status: 'DRAFT' } }),
      this.prisma.tradeOffer.count(),
      this.prisma.tradeOffer.count({ where: { status: 'PENDING' } }),
      this.prisma.trade.count({ where: { status: 'COMPLETED' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        banned: bannedUsers,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        draft: draftListings,
      },
      offers: {
        total: totalOffers,
        pending: pendingOffers,
      },
      trades: {
        completed: completedTrades,
      },
    };
  }

  // ── User list ─────────────────────────────────────────────────────────────

  async getUsers(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.search && {
        OR: [
          { displayName: { contains: query.search } },
          { email: { contains: query.search } },
          { username: { contains: query.search } },
        ],
      }),
      ...(query.role && { role: query.role }),
      ...(query.status && { status: query.status }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          ...USER_SELECT,
          _count: {
            select: {
              listings: true,
              sentTradeOffers: true,
              receivedTradeOffers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const enriched: AdminUserSummary[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      displayName: u.displayName,
      profileImage: u.profileImage,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      listingCount: u._count.listings,
      activeListingCount: 0, // populated below if needed
      offersSentCount: u._count.sentTradeOffers,
      offersReceivedCount: u._count.receivedTradeOffers,
    }));

    return {
      users: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  // ── User detail ───────────────────────────────────────────────────────────

  async getUserById(id: string): Promise<AdminUserDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        _count: {
          select: {
            listings: true,
            sentTradeOffers: true,
            receivedTradeOffers: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Active listing count needs a filtered query
    const [activeListingCount, completedTradeCount] = await Promise.all([
      this.prisma.listing.count({ where: { userId: id, status: 'ACTIVE' } }),
      this.prisma.trade.count({
        where: {
          status: 'COMPLETED',
          tradeOffer: {
            OR: [{ senderId: id }, { receiverId: id }],
          },
        },
      }),
    ]);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      profileImage: user.profileImage,
      bio: user.bio,
      location: user.location,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      listingCount: user._count.listings,
      activeListingCount,
      offersSentCount: user._count.sentTradeOffers,
      offersReceivedCount: user._count.receivedTradeOffers,
      completedTradeCount,
    };
  }

  // ── Update user status ────────────────────────────────────────────────────

  async updateUserStatus(targetId: string, dto: UpdateUserStatusDto, adminId: string) {
    // Prevent admin from deactivating themselves
    if (targetId === adminId) {
      throw new BadRequestException('You cannot change your own account status');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { status: dto.status },
      select: USER_SELECT,
    });

    return updated;
  }

  // ── Listing list ──────────────────────────────────────────────────────────

  async getListings(query: AdminListingsQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50); // Cap at 50
    const skip = (page - 1) * limit;

    const where = {
      ...(query.search && {
        OR: [
          { title: { contains: query.search } },
          { description: { contains: query.search } },
          {
            user: {
              OR: [
                { displayName: { contains: query.search } },
                { username: { contains: query.search } },
                { email: { contains: query.search } },
              ],
            },
          },
        ],
      }),
      ...(query.status && { status: query.status }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.condition && { condition: query.condition }),
    };

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          condition: true,
          estimatedValue: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              displayName: true,
              username: true,
              profileImage: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            select: {
              id: true,
              imageUrl: true,
              videoUrl: true,
            },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    const enriched: AdminListingSummary[] = listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      status: listing.status,
      condition: listing.condition,
      estimatedValue: listing.estimatedValue,
      location: listing.location,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      owner: listing.user,
      category: listing.category,
      images: listing.images,
    }));

    return {
      listings: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  // ── Listing detail ────────────────────────────────────────────────────────

  async getListingById(id: string): Promise<AdminListingDetail> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        listingType: true,
        condition: true,
        status: true,
        estimatedValue: true,
        location: true,
        lookingFor: true,
        tradePreference: true,
        exchangeMethod: true,
        interestedInCategories: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            username: true,
            profileImage: true,
            status: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            id: true,
            imageUrl: true,
            videoUrl: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      listingType: listing.listingType,
      condition: listing.condition,
      status: listing.status,
      estimatedValue: listing.estimatedValue,
      location: listing.location,
      lookingFor: listing.lookingFor,
      tradePreference: listing.tradePreference,
      exchangeMethod: listing.exchangeMethod,
      interestedInCategories: listing.interestedInCategories,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      owner: listing.user,
      category: listing.category,
      images: listing.images,
    };
  }

  // ── Update listing status ─────────────────────────────────────────────────

  async updateListingStatus(id: string, dto: UpdateListingStatusDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: dto.status },
    });

    return updated;
  }
}
