import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { mediaFileFilter, multerStorage, MAX_IMAGE_SIZE_MB } from '../listings/multer.config';

interface JwtUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
}

/** Fields returned to the authenticated user (includes email) */
function toPrivateProfile(user: {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profileImage: string | null;
  bio: string | null;
  location: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    profileImage: user.profileImage,
    bio: user.bio,
    location: user.location,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── GET /users/me — authenticated user's own full profile ─────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated user's full private profile" })
  async getMe(@CurrentUser() jwtUser: JwtUser) {
    const user = await this.usersService.findById(jwtUser.id);
    if (!user) return null;
    return { user: toPrivateProfile(user) };
  }

  // ── PATCH /users/me — update own profile fields ───────────────────────────

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update the authenticated user's profile" })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  async updateMe(@CurrentUser() jwtUser: JwtUser, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(jwtUser.id, dto);
    return { message: 'Profile updated', user: toPrivateProfile(user) };
  }

  // ── POST /users/me/avatar — upload avatar ─────────────────────────────────

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: "Upload or replace the authenticated user's avatar" })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: multerStorage,
      fileFilter: mediaFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024 },
    }),
  )
  async uploadAvatar(@CurrentUser() jwtUser: JwtUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { message: 'No file uploaded' };
    }
    const user = await this.usersService.updateAvatar(jwtUser.id, file.filename);
    return { message: 'Avatar updated', user: toPrivateProfile(user) };
  }

  // ── DELETE /users/me/avatar — remove avatar ───────────────────────────────

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove the authenticated user's avatar" })
  async removeAvatar(@CurrentUser() jwtUser: JwtUser) {
    const user = await this.usersService.removeAvatar(jwtUser.id);
    return { message: 'Avatar removed', user: toPrivateProfile(user) };
  }

  // ── GET /users/:username — public profile ─────────────────────────────────

  @Get(':username')
  @ApiOperation({ summary: 'Get a public profile by username' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(@Param('username') username: string) {
    const profile = await this.usersService.findPublicProfile(username);
    return { profile };
  }
}
