import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Ip = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const xff = request.headers['x-forwarded-for'];
    if (typeof xff === 'string') return xff.split(',')[0].trim();
    if (Array.isArray(xff)) return xff[0];
    return request.ip;
  },
);
