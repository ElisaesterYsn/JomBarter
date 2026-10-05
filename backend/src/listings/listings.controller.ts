import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { mediaFileFilter, multerStorage, MAX_IMAGE_SIZE_MB } from './multer.config';

interface JwtUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
}

/** Multer interceptor: images only, max 8 files, 10 MB each */
const IMAGES_INTERCEPTOR = FilesInterceptor('images', 8, {
  storage: multerStorage,
  fileFilter: mediaFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024 },
});

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // ── Public feed ───────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Browse all active listings (public feed)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'excludeId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  async getPublicFeed(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
    @Query('categoryId') categoryId?: string,
    @Query('excludeId') excludeId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.listingsService.findPublicFeed(
      page,
      Math.min(limit, 50),
      categoryId || undefined,
      excludeId || undefined,
      userId || undefined,
    );
  }

  // ── Authenticated: my listings ────────────────────────────────────────────

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated user's listings" })
  async getMyListings(@CurrentUser() user: JwtUser) {
    const listings = await this.listingsService.findByUser(user.id);
    return { listings };
  }

  // ── Public: single listing ────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a single listing by id' })
  async getOne(@Param('id') id: string) {
    const listing = await this.listingsService.findOne(id);
    return { listing };
  }

  // ── Authenticated: create ─────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new listing (up to 8 images)' })
  @ApiResponse({ status: 201, description: 'Listing created' })
  @UseInterceptors(IMAGES_INTERCEPTOR)
  async create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateListingDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    const listing = await this.listingsService.create(user.id, dto, files ?? []);
    return { message: 'Listing created', listing };
  }

  // ── Authenticated: update ─────────────────────────────────────────────────

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a listing; append new images (up to 8 per request)' })
  @UseInterceptors(IMAGES_INTERCEPTOR)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateListingDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    const listing = await this.listingsService.update(id, user.id, dto, files ?? []);
    return { message: 'Listing updated', listing };
  }

  // ── Authenticated: delete image ───────────────────────────────────────────

  @Delete(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a single image from a listing' })
  async deleteMedia(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.listingsService.deleteMedia(id, mediaId, user.id);
    return { message: 'Image deleted' };
  }

  // ── Authenticated: delete listing ─────────────────────────────────────────

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a listing and all its images' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    await this.listingsService.remove(id, user.id);
    return { message: 'Listing deleted' };
  }

  // ── Authenticated: publish ────────────────────────────────────────────────

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a listing (DRAFT → ACTIVE)' })
  async publish(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const listing = await this.listingsService.publish(id, user.id);
    return { message: 'Listing published', listing };
  }

  // ── Authenticated: unpublish ──────────────────────────────────────────────

  @Patch(':id/unpublish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish a listing (ACTIVE → DRAFT)' })
  async unpublish(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const listing = await this.listingsService.unpublish(id, user.id);
    return { message: 'Listing unpublished', listing };
  }

  // ── Authenticated: mark as traded ─────────────────────────────────────────

  @Patch(':id/traded')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a listing as traded (removes from public feed)' })
  async markAsTraded(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    const listing = await this.listingsService.markAsTraded(id, user.id);
    return { message: 'Listing marked as traded', listing };
  }
}
