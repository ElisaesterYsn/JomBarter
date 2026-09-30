import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Canonical category list for JomBarter. */
export const SEED_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Phones & Tablets', slug: 'phones-tablets' },
  { name: 'Computers', slug: 'computers' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Living', slug: 'home-living' },
  { name: 'Furniture', slug: 'furniture' },
  { name: 'Vehicles', slug: 'vehicles' },
  { name: 'Books', slug: 'books' },
  { name: 'Sports & Fitness', slug: 'sports-fitness' },
  { name: 'Hobbies & Collectibles', slug: 'hobbies-collectibles' },
  { name: 'Services', slug: 'services' },
  { name: 'Other', slug: 'other' },
] as const;

@Injectable()
export class CategoriesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure all canonical categories exist when the application starts.
   * Uses upsert so re-runs are idempotent.
   */
  async onApplicationBootstrap() {
    for (const cat of SEED_CATEGORIES) {
      await this.prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, isActive: true },
        create: { name: cat.name, slug: cat.slug, isActive: true },
      });
    }
    this.logger.log(`Seeded ${SEED_CATEGORIES.length} categories`);
  }

  /** Return all active categories ordered alphabetically. */
  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }
}
