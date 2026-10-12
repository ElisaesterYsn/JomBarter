import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

// ── Minimal Prisma mock ───────────────────────────────────────────────────────
const mockPrisma = {
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  listing: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  tradeOffer: { count: jest.fn() },
  trade: { count: jest.fn() },
};

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  // ── getDashboardStats ─────────────────────────────────────────────────────

  describe('getDashboardStats', () => {
    it('returns platform statistics', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8) // active
        .mockResolvedValueOnce(1) // suspended
        .mockResolvedValueOnce(1); // banned
      mockPrisma.listing.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(15) // active
        .mockResolvedValueOnce(5); // draft
      mockPrisma.tradeOffer.count
        .mockResolvedValueOnce(30) // total
        .mockResolvedValueOnce(5); // pending
      mockPrisma.trade.count.mockResolvedValueOnce(6); // completed

      const result = await service.getDashboardStats();

      expect(result.users.total).toBe(10);
      expect(result.users.active).toBe(8);
      expect(result.listings.active).toBe(15);
      expect(result.offers.pending).toBe(5);
      expect(result.trades.completed).toBe(6);
    });
  });

  // ── getUserById ───────────────────────────────────────────────────────────

  describe('getUserById', () => {
    it('returns user detail for a valid id', async () => {
      const fakeUser = {
        id: 'user1',
        email: 'a@b.com',
        username: 'alice',
        displayName: 'Alice',
        profileImage: null,
        bio: null,
        location: null,
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { listings: 3, sentTradeOffers: 1, receivedTradeOffers: 2 },
      };
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.listing.count.mockResolvedValue(2);
      mockPrisma.trade.count.mockResolvedValue(1);

      const result = await service.getUserById('user1');
      expect(result.email).toBe('a@b.com');
      expect(result.listingCount).toBe(3);
      expect(result.activeListingCount).toBe(2);
      expect(result.completedTradeCount).toBe(1);
      // passwordHash must never appear
      expect((result as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateUserStatus ──────────────────────────────────────────────────────

  describe('updateUserStatus', () => {
    it('updates status for a valid target user', async () => {
      const target = { id: 'user2', email: 'b@b.com' };
      mockPrisma.user.findUnique.mockResolvedValue(target);
      mockPrisma.user.update.mockResolvedValue({ ...target, status: 'SUSPENDED' });

      const result = await service.updateUserStatus('user2', { status: 'SUSPENDED' }, 'admin1');
      expect(result.status).toBe('SUSPENDED');
    });

    it('throws BadRequestException when admin targets themselves', async () => {
      await expect(
        service.updateUserStatus('admin1', { status: 'SUSPENDED' }, 'admin1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for unknown target user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateUserStatus('nobody', { status: 'SUSPENDED' }, 'admin1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

// ── getListings ───────────────────────────────────────────────────────────

describe('getListings', () => {
  it('returns paginated listings', async () => {
    const fakeListings = [
      {
        id: 'list1',
        title: 'iPhone 13',
        status: 'ACTIVE',
        condition: 'GOOD',
        estimatedValue: 500,
        location: 'KL',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'u1', displayName: 'Alice', username: 'alice', profileImage: null },
        category: { id: 'c1', name: 'Electronics', slug: 'electronics' },
        images: [{ id: 'img1', imageUrl: 'file1.jpg', videoUrl: null }],
      },
    ];
    mockPrisma.listing.findMany.mockResolvedValue(fakeListings);
    mockPrisma.listing.count.mockResolvedValue(1);

    const result = await service.getListings({ page: 1, limit: 20 });
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].title).toBe('iPhone 13');
    expect(result.pagination.total).toBe(1);
  });

  it('supports search filtering', async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    await service.getListings({ page: 1, limit: 20, search: 'laptop' });
    expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it('supports status filtering', async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    await service.getListings({ page: 1, limit: 20, status: 'ACTIVE' });
    expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    );
  });
});

// ── getListingById ────────────────────────────────────────────────────────

describe('getListingById', () => {
  it('returns listing detail for valid id', async () => {
    const fakeListing = {
      id: 'list1',
      title: 'iPhone 13',
      description: 'Great condition phone',
      listingType: 'PHYSICAL_ITEM',
      condition: 'GOOD',
      status: 'ACTIVE',
      estimatedValue: 500,
      location: 'KL',
      lookingFor: 'Laptop',
      tradePreference: 'SIMILAR_VALUE',
      exchangeMethod: 'MEETUP',
      interestedInCategories: 'c2,c3',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'u1',
        email: 'owner@example.com',
        displayName: 'Alice',
        username: 'alice',
        profileImage: null,
        status: 'ACTIVE',
      },
      category: { id: 'c1', name: 'Electronics', slug: 'electronics' },
      images: [{ id: 'img1', imageUrl: 'file1.jpg', videoUrl: null, sortOrder: 0 }],
    };
    mockPrisma.listing.findUnique.mockResolvedValue(fakeListing);

    const result = await service.getListingById('list1');
    expect(result.title).toBe('iPhone 13');
    expect(result.owner.email).toBe('owner@example.com');
    expect(result.images).toHaveLength(1);
  });

  it('throws NotFoundException for nonexistent listing', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(null);
    await expect(service.getListingById('nonexistent')).rejects.toThrow(NotFoundException);
  });
});

// ── updateListingStatus ───────────────────────────────────────────────────

describe('updateListingStatus', () => {
  it('updates listing status', async () => {
    const existing = { id: 'list1', status: 'ACTIVE', userId: 'u1' };
    mockPrisma.listing.findUnique.mockResolvedValue(existing);
    mockPrisma.listing.update.mockResolvedValue({ ...existing, status: 'REMOVED' });

    const result = await service.updateListingStatus('list1', { status: 'REMOVED' });
    expect(result.status).toBe('REMOVED');
  });

  it('throws NotFoundException for nonexistent listing', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(null);
    await expect(service.updateListingStatus('nonexistent', { status: 'REMOVED' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
});
