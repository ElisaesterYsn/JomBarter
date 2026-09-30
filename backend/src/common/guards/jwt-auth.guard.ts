import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protects a route with JWT Bearer authentication.
 * Attach with @UseGuards(JwtAuthGuard) on any controller or handler.
 * On success, req.user is populated by JwtStrategy.validate().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
