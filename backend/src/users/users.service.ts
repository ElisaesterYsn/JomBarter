import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  displayName: string;
}

/** Fields safe to expose on a public profile (no email/passwordHash) */
export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  profileImage: string | null;
  bio: string | null;
  location: string | null;
  createdAt: Date;
  activeListingCount: number;
  completedTradeCount: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Auth helpers (used by AuthService) ────────────────────────────────────

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserData): Promise<User> {
    const username = await this.generateUniqueUsername(data.email);
    return this.prisma.user.create({
      data: {
        email: data.email,
        username,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        role: 'USER',
        status: 'ACTIVE',
      },
    });
  }

  // ── Profile queries ───────────────────────────────────────────────────────

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  /**
   * Returns a public profile response — no sensitive fields.
   * Includes counts for active listings and completed trades.
   */
  async findPublicProfile(username: string): Promise<PublicProfile> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || user.status !== 'ACTIVE') {
      throw new NotFoundException('User not found');
    }

    const [activeListingCount, completedTradeCount] = await Promise.all([
      this.prisma.listing.count({ where: { userId: user.id, status: 'ACTIVE' } }),
      this.prisma.trade.count({
        where: {
          status: 'COMPLETED',
          tradeOffer: {
            OR: [{ senderId: user.id }, { receiverId: user.id }],
          },
        },
      }),
    ]);

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      profileImage: user.profileImage,
      bio: user.bio,
      location: user.location,
      createdAt: user.createdAt,
      activeListingCount,
      completedTradeCount,
    };
  }

  // ── Profile mutations ─────────────────────────────────────────────────────

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    // If username is being changed, check for conflicts
    if (dto.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Username is already taken');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.location !== undefined && { location: dto.location }),
      },
    });
  }

  async updateAvatar(id: string, filename: string): Promise<User> {
    // Delete the old avatar file from disk if one exists
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (existing?.profileImage) {
      this.deleteFileIfExists(existing.profileImage);
    }

    return this.prisma.user.update({
      where: { id },
      data: { profileImage: filename },
    });
  }

  async removeAvatar(id: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (existing?.profileImage) {
      this.deleteFileIfExists(existing.profileImage);
    }
    return this.prisma.user.update({
      where: { id },
      data: { profileImage: null },
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async generateUniqueUsername(email: string): Promise<string> {
    const base = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 30);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      candidate = `${base}${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private deleteFileIfExists(filename: string) {
    try {
      const filePath = path.join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      this.logger.warn(`Could not delete file: ${filename}`, err);
    }
  }
}
