import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

export interface UploadedImages {
  images: Express.Multer.File[];
}

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateListingDto, images: Express.Multer.File[]) {
    // Validate the categoryId refers to an existing, active category
    await this.assertCategoryExists(dto.categoryId);

    const listing = await this.prisma.listing.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        condition: dto.condition,
        location: dto.location ?? null,
        lookingFor: dto.lookingFor ?? null,
        status: 'DRAFT',
      },
    });

    await this.saveImages(listing.id, images);

    return this.findOneWithMedia(listing.id);
  }

  // ── Public feed ───────────────────────────────────────────────────────────

  async findPublicFeed(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: { status: 'ACTIVE' },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          user: {
            select: { id: true, displayName: true, username: true, profileImage: true },
          },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      listings,
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

  // ── Find all for user ─────────────────────────────────────────────────────

  async findByUser(userId: string) {
    return this.prisma.listing.findMany({
      where: { userId },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Find one ──────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const listing = await this.findOneWithMedia(id);
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: string, userId: string, dto: UpdateListingDto, images: Express.Multer.File[]) {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Listing not found');
    if (existing.userId !== userId) throw new ForbiddenException('Not your listing');

    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);

    await this.prisma.listing.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.condition !== undefined && { condition: dto.condition }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.lookingFor !== undefined && { lookingFor: dto.lookingFor }),
      },
    });

    if (images.length) {
      await this.saveImages(id, images);
    }

    return this.findOneWithMedia(id);
  }

  // ── Delete media item ─────────────────────────────────────────────────────

  async deleteMedia(listingId: string, mediaId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId !== userId) throw new ForbiddenException('Not your listing');

    const media = await this.prisma.listingImage.findUnique({ where: { id: mediaId } });
    if (!media || media.listingId !== listingId) {
      throw new NotFoundException('Media item not found');
    }

    this.deleteFileIfExists(media.imageUrl);
    await this.prisma.listingImage.delete({ where: { id: mediaId } });
  }

  // ── Delete listing ────────────────────────────────────────────────────────

  async remove(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId !== userId) throw new ForbiddenException('Not your listing');

    for (const item of listing.images) {
      this.deleteFileIfExists(item.imageUrl);
    }

    await this.prisma.listing.delete({ where: { id } });
  }

  // ── Publish / unpublish ───────────────────────────────────────────────────

  async publish(id: string, userId: string) {
    return this.setStatus(id, userId, 'ACTIVE');
  }

  async unpublish(id: string, userId: string) {
    return this.setStatus(id, userId, 'DRAFT');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async setStatus(id: string, userId: string, status: string) {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Listing not found');
    if (existing.userId !== userId) throw new ForbiddenException('Not your listing');
    return this.prisma.listing.update({ where: { id }, data: { status } });
  }

  private async findOneWithMedia(id: string) {
    return this.prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, displayName: true, username: true } },
      },
    });
  }

  private async saveImages(listingId: string, files: Express.Multer.File[]) {
    if (!files.length) return;
    const existing = await this.prisma.listingImage.count({ where: { listingId } });
    const rows = files.map((file, i) => ({
      listingId,
      imageUrl: file.filename,
      videoUrl: null,
      sortOrder: existing + i,
    }));
    await this.prisma.listingImage.createMany({ data: rows });
  }

  private async assertCategoryExists(categoryId: string) {
    const cat = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat || !cat.isActive) {
      throw new BadRequestException(`Category "${categoryId}" not found or inactive`);
    }
  }

  private deleteFileIfExists(filename: string | null | undefined) {
    if (!filename) return;
    try {
      const filePath = path.join(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      this.logger.warn(`Could not delete file: ${filename}`, err);
    }
  }
}
