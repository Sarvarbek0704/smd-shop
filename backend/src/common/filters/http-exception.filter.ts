import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ichki server xatosi';
    let errors: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exRes = exception.getResponse();

      if (typeof exRes === 'string') {
        message = exRes;
      } else if (typeof exRes === 'object' && exRes !== null) {
        const obj = exRes as Record<string, unknown>;

        if (typeof obj.message === 'string') {
          message = obj.message;
        } else if (Array.isArray(obj.message)) {
          // Bu zaxira yo'l: agar qayerdadir ValidationPipe'ning default
          // exceptionFactory'si ishlasa va bizga string[] kelsa.
          message = 'Validatsiya xatosi';
          errors = { _general: obj.message as string[] };
        }

        if (
          obj.errors &&
          typeof obj.errors === 'object' &&
          !Array.isArray(obj.errors)
        ) {
          errors = obj.errors as Record<string, string[]>;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      message =
        process.env.NODE_ENV === 'production'
          ? 'Ichki server xatosi'
          : exception.message;
    } else {
      this.logger.error("Noma'lum xato", JSON.stringify(exception));
    }

    const body: ApiErrorResponse = {
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }
}
