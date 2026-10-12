import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

const mockAdminService = {
  getDashboardStats: jest.fn(),
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  updateUserStatus: jest.fn(),
  getListings: jest.fn(),
  getListingById: jest.fn(),
  updateListingStatus: jest.fn(),
};

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
        { provide: RolesGuard, useValue: { canActivate: () => true } },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('returns dashboard stats', async () => {
      const stats = { users: { total: 5 }, listings: {}, offers: {}, trades: {} };
      mockAdminService.getDashboardStats.mockResolvedValue(stats);
      const result = await controller.getDashboard();
      expect(result).toEqual({ stats });
    });
  });

  describe('getUsers', () => {
    it('returns paginated users', async () => {
      const data = { users: [], pagination: { total: 0 } };
      mockAdminService.getUsers.mockResolvedValue(data);
      const result = await controller.getUsers({});
      expect(result).toEqual(data);
    });
  });

  describe('getUserById', () => {
    it('returns a user detail', async () => {
      const user = { id: 'u1', email: 'a@b.com', role: 'USER' };
      mockAdminService.getUserById.mockResolvedValue(user);
      const result = await controller.getUserById('u1');
      expect(result).toEqual({ user });
    });
  });

  describe('updateUserStatus', () => {
    it('delegates to adminService and returns updated user', async () => {
      const updatedUser = { id: 'u2', status: 'SUSPENDED' };
      mockAdminService.updateUserStatus.mockResolvedValue(updatedUser);
      const result = await controller.updateUserStatus(
        'u2',
        { status: 'SUSPENDED' },
        {
          id: 'admin1',
          email: 'admin@b.com',
          username: 'admin',
          displayName: 'Admin',
          role: 'ADMIN',
        },
      );
      expect(result.message).toContain('SUSPENDED');
      expect(result.user).toEqual(updatedUser);
    });
  });

// ── RolesGuard unit test ──────────────────────────────────────────────────────

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    guard = new RolesGuard(reflector);
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
  });

  it('allows ADMIN role', () => {
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'ADMIN' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as import('@nestjs/common').ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies USER role', () => {
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'USER' } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as import('@nestjs/common').ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('denies unauthenticated (no user)', () => {
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({}) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as import('@nestjs/common').ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});

describe('getListings', () => {
  it('returns paginated listings', async () => {
    const data = { listings: [], pagination: { total: 0 } };
    mockAdminService.getListings.mockResolvedValue(data);
    const result = await controller.getListings({});
    expect(result).toEqual(data);
  });
});

describe('getListingById', () => {
  it('returns listing detail', async () => {
    const listing = { id: 'list1', title: 'iPhone', status: 'ACTIVE' };
    mockAdminService.getListingById.mockResolvedValue(listing);
    const result = await controller.getListingById('list1');
    expect(result).toEqual({ listing });
  });
});

describe('updateListingStatus', () => {
  it('updates listing status and returns result', async () => {
    const updatedListing = { id: 'list1', status: 'REMOVED' };
    mockAdminService.updateListingStatus.mockResolvedValue(updatedListing);
    const result = await controller.updateListingStatus('list1', { status: 'REMOVED' });
    expect(result.message).toContain('REMOVED');
    expect(result.listing).toEqual(updatedListing);
  });
});
});
