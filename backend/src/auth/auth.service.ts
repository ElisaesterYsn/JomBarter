import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;

// ── Shared safe-user projection ───────────────────────────────────────────────

export interface SafeUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profileImage: string | null;
  role: string;
  createdAt: Date;
}

// ── Response shapes ───────────────────────────────────────────────────────────

export type RegisteredUser = SafeUser;

export interface LoginResult {
  access_token: string;
  user: SafeUser;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Register ─────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<RegisteredUser> {
    // email + displayName normalised by @Transform in RegisterDto
    const { email, displayName } = dto;

    // 1. Duplicate-email check
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // 2. Hash password — never store plaintext
    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    } catch (err) {
      this.logger.error('Password hashing failed', err);
      throw new InternalServerErrorException('Registration failed');
    }

    // 3. Persist user
    let user: Awaited<ReturnType<typeof this.usersService.create>>;
    try {
      user = await this.usersService.create({ email, passwordHash, displayName });
    } catch (err) {
      if ((err as any)?.code === 'P2002') {
        throw new ConflictException('An account with this email already exists');
      }
      this.logger.error('User creation failed', err);
      throw new InternalServerErrorException('Registration failed');
    }

    return this.toSafeUser(user);
  }

  // ── Login ─────────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<LoginResult> {
    // 1. Look up the user — use a generic error to avoid user-enumeration
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Account status check before doing the expensive bcrypt comparison
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Your account is suspended or banned');
    }

    // 3. Verify password
    let passwordMatches: boolean;
    try {
      passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    } catch (err) {
      this.logger.error('Password comparison failed', err);
      throw new InternalServerErrorException('Login failed');
    }

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 4. Issue JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: this.toSafeUser(user),
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private toSafeUser(user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    profileImage: string | null;
    role: string;
    createdAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      profileImage: user.profileImage,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
