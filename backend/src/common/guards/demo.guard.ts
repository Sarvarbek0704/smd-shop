import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/** Routes that must always work even for demo users (login / refresh). */
const DEMO_ALLOWED_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/verify-email',
];

@Injectable()
export class DemoGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const method: string = req.method?.toUpperCase() ?? 'GET';

    if (SAFE_METHODS.includes(method)) return true;

    const path: string = req.path ?? '';
    if (DEMO_ALLOWED_PATHS.some((p) => path.startsWith(p))) return true;

    const user = req.user;
    if (user?.isDemo) {
      throw new ForbiddenException(
        "Demo hisob uchun bu amal mumkin emas. Ro'yxatdan o'ting yoki tizimga kiring.",
      );
    }

    return true;
  }
}
