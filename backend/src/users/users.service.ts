import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  displayName: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by email (case-insensitive — email should already be
   * normalised to lowercase before calling this).
   * Returns null when not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by id.
   * Returns null when not found.
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new user.
   * - Derives a unique username from the email local part.
   * - Sets role = "USER" and status = "ACTIVE" by default.
   * - Never stores plaintext passwords; the caller must pass an already-hashed
   *   value in `passwordHash`.
   */
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

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Derives a username from the local part of an email address and appends a
   * numeric suffix until it is unique in the database.
   * e.g.  "user@example.com"  →  "user"  or  "user2", "user3", …
   */
  private async generateUniqueUsername(email: string): Promise<string> {
    // Sanitise: take everything before @, keep only alphanumerics + underscores
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
}
