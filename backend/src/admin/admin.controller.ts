import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminListingsQueryDto } from './dto/admin-listings-query.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';

interface JwtUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── GET /admin/dashboard ──────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get platform statistics (admin only)' })
  async getDashboard() {
    const stats = await this.adminService.getDashboardStats();
    return { stats };
  }

  // ── GET /admin/users ──────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin only)' })
  async getUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  // ── GET /admin/users/:id ──────────────────────────────────────────────────

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details (admin only)' })
  async getUserById(@Param('id') id: string) {
    const user = await this.adminService.getUserById(id);
    return { user };
  }

  // ── PATCH /admin/users/:id/status ─────────────────────────────────────────

  @Patch('users/:id/status')
  @ApiOperation({ summary: "Update a user's account status (admin only)" })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: JwtUser,
  ) {
    const user = await this.adminService.updateUserStatus(id, dto, admin.id);
    return { message: `User status updated to ${dto.status}`, user };
  }

  // ── GET /admin/listings ───────────────────────────────────────────────────

  @Get('listings')
  @ApiOperation({ summary: 'List all listings (admin only)' })
  async getListings(@Query() query: AdminListingsQueryDto) {
    return this.adminService.getListings(query);
  }

  // ── GET /admin/listings/:id ───────────────────────────────────────────────

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get listing details (admin only)' })
  async getListingById(@Param('id') id: string) {
    const listing = await this.adminService.getListingById(id);
    return { listing };
  }

  // ── PATCH /admin/listings/:id/status ──────────────────────────────────────

  @Patch('listings/:id/status')
  @ApiOperation({ summary: "Update a listing's status (admin only)" })
  async updateListingStatus(@Param('id') id: string, @Body() dto: UpdateListingStatusDto) {
    const listing = await this.adminService.updateListingStatus(id, dto);
    return { message: `Listing status updated to ${dto.status}`, listing };
  }
}
