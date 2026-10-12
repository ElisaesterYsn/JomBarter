import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Attach required roles to a route or controller.
 * Usage: @Roles('ADMIN') or @Roles('ADMIN', 'MODERATOR')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
