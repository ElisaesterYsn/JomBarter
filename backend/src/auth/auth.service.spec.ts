import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const PLAIN_PASSWORD = 'password123';

// Pre-computed hash so tests that need it don't wait on bcrypt
let HASHED_PASSWORD: string;
beforeAll(async () => {
  HASHED_PASSWORD = await bcrypt.hash(PLAIN_PASSWORD, 10);
});

const makeStoredUser = (overrides: Partial<typeof BASE_STORED_USER> = {}) => ({
  ...BASE_STORED_USER,
  ...overrides,
});

const BASE_STORED_USER = {
  id: 'cuid_abc123',
  email: 'user@example.com',
  username: 'user',
  get passwordHash() {
    return HASHED_PASSWORD;
  },
  displayName: 'Eli',
  profileImage: null,
  bio: null,
  location: null,
  role: 'USER',
  status: 'ACTIVE',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const REGISTER_DTO: RegisterDto = {
  email: 'user@example.com',
  password: PLAIN_PASSWORD,
  displayName: 'Eli',
};

const LOGIN_DTO: LoginDto = {
  email: 'user@example.com',
  password: PLAIN_PASSWORD,
};

const FAKE_JWT = 'signed.jwt.token';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue(FAKE_JWT),
};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // register()
  // ══════════════════════════════════════════════════════════════════════════════

  describe('register() — success', () => {
    beforeEach(() => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(BASE_STORED_USER);
    });

    it('returns a safe user projection', async () => {
      const result = await service.register(REGISTER_DTO);
      expect(result).toMatchObject({
        id: BASE_STORED_USER.id,
        email: BASE_STORED_USER.email,
        username: BASE_STORED_USER.username,
        displayName: BASE_STORED_USER.displayName,
        role: 'USER',
      });
    });

    it('does NOT include passwordHash or password', async () => {
      const result = await service.register(REGISTER_DTO);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('password');
    });

    it('does NOT include status or profileImage', async () => {
      const result = await service.register(REGISTER_DTO);
      expect(result).not.toHaveProperty('status');
      expect(result).not.toHaveProperty('profileImage');
    });

    it('calls UsersService.create with a hash, not plaintext', async () => {
      await service.register(REGISTER_DTO);
      const arg = mockUsersService.create.mock.calls[0][0];
      expect(arg.passwordHash).toBeDefined();
      expect(arg.passwordHash).not.toBe(PLAIN_PASSWORD);
      expect(arg).not.toHaveProperty('password');
    });

    it('passes normalised email and displayName', async () => {
      const dto: RegisterDto = {
        email: 'user@example.com',
        password: PLAIN_PASSWORD,
        displayName: 'Eli',
      };
      await service.register(dto);
      const arg = mockUsersService.create.mock.calls[0][0];
      expect(arg.email).toBe('user@example.com');
      expect(arg.displayName).toBe('Eli');
    });
  });

  describe('register() — password hashing', () => {
    beforeEach(() => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(BASE_STORED_USER);
    });

    it('stores a bcrypt hash starting with $2b$', async () => {
      await service.register(REGISTER_DTO);
      const { passwordHash } = mockUsersService.create.mock.calls[0][0];
      expect(passwordHash).toMatch(/^\$2b\$/);
    });

    it('hash validates against the original password', async () => {
      await service.register(REGISTER_DTO);
      const { passwordHash } = mockUsersService.create.mock.calls[0][0];
      expect(await bcrypt.compare(PLAIN_PASSWORD, passwordHash)).toBe(true);
    });

    it('two registrations produce different hashes (salt)', async () => {
      await service.register(REGISTER_DTO);
      await service.register(REGISTER_DTO);
      const h1 = mockUsersService.create.mock.calls[0][0].passwordHash;
      const h2 = mockUsersService.create.mock.calls[1][0].passwordHash;
      expect(h1).not.toBe(h2);
    });
  });

  describe('register() — duplicate email', () => {
    it('throws ConflictException when email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(BASE_STORED_USER);
      await expect(service.register(REGISTER_DTO)).rejects.toThrow(ConflictException);
    });

    it('ConflictException message is descriptive', async () => {
      mockUsersService.findByEmail.mockResolvedValue(BASE_STORED_USER);
      await expect(service.register(REGISTER_DTO)).rejects.toThrow(
        'An account with this email already exists',
      );
    });

    it('does NOT call UsersService.create on duplicate', async () => {
      mockUsersService.findByEmail.mockResolvedValue(BASE_STORED_USER);
      await expect(service.register(REGISTER_DTO)).rejects.toThrow(ConflictException);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('register() — P2002 race condition', () => {
    it('throws ConflictException on Prisma P2002', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const err = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      mockUsersService.create.mockRejectedValue(err);
      await expect(service.register(REGISTER_DTO)).rejects.toThrow(ConflictException);
    });
  });

  describe('register() — unexpected DB error', () => {
    it('throws InternalServerErrorException on unknown error', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockRejectedValue(new Error('DB connection lost'));
      await expect(service.register(REGISTER_DTO)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // login()
  // ══════════════════════════════════════════════════════════════════════════════

  describe('login() — success', () => {
    beforeEach(() => {
      mockUsersService.findByEmail.mockResolvedValue(makeStoredUser());
    });

    it('returns access_token and safe user projection', async () => {
      const result = await service.login(LOGIN_DTO);
      expect(result).toMatchObject({
        access_token: FAKE_JWT,
        user: {
          id: BASE_STORED_USER.id,
          email: BASE_STORED_USER.email,
          username: BASE_STORED_USER.username,
          displayName: BASE_STORED_USER.displayName,
          role: 'USER',
        },
      });
    });

    it('does NOT include passwordHash in the login response', async () => {
      const result = await service.login(LOGIN_DTO);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('password');
    });

    it('calls JwtService.sign with sub, email, role payload', async () => {
      await service.login(LOGIN_DTO);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: BASE_STORED_USER.id,
        email: BASE_STORED_USER.email,
        role: BASE_STORED_USER.role,
      });
    });

    it('calls JwtService.sign exactly once', async () => {
      await service.login(LOGIN_DTO);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });
  });

  describe('login() — wrong password', () => {
    beforeEach(() => {
      mockUsersService.findByEmail.mockResolvedValue(makeStoredUser());
    });

    it('throws UnauthorizedException for wrong password', async () => {
      await expect(
        service.login({ email: LOGIN_DTO.email, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('uses a generic error message (no user enumeration)', async () => {
      await expect(
        service.login({ email: LOGIN_DTO.email, password: 'wrongpassword' }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('does NOT call JwtService.sign on wrong password', async () => {
      await expect(
        service.login({ email: LOGIN_DTO.email, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('login() — user not found', () => {
    it('throws UnauthorizedException with generic message', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.login(LOGIN_DTO)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(LOGIN_DTO)).rejects.toThrow('Invalid email or password');
    });

    it('does NOT call JwtService.sign when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.login(LOGIN_DTO)).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('login() — inactive account', () => {
    it('throws UnauthorizedException for SUSPENDED account', async () => {
      mockUsersService.findByEmail.mockResolvedValue(makeStoredUser({ status: 'SUSPENDED' }));
      await expect(service.login(LOGIN_DTO)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(LOGIN_DTO)).rejects.toThrow('suspended or banned');
    });

    it('throws UnauthorizedException for BANNED account', async () => {
      mockUsersService.findByEmail.mockResolvedValue(makeStoredUser({ status: 'BANNED' }));
      await expect(service.login(LOGIN_DTO)).rejects.toThrow(UnauthorizedException);
    });

    it('does NOT call JwtService.sign for inactive accounts', async () => {
      mockUsersService.findByEmail.mockResolvedValue(makeStoredUser({ status: 'SUSPENDED' }));
      await expect(service.login(LOGIN_DTO)).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
