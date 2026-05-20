import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../database/entities/enums';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─────────────────────────────────────────────────────────────
  // AUTHENTICATED — buyer endpoints
  // ─────────────────────────────────────────────────────────────

  /**
   * Initiate a payment session for an order.
   * Returns a simulator URL and a short-lived token.
   */
  @Post('initiate/:orderId')
  initiatePayment(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.initiatePayment(orderId, userId);
  }

  /**
   * Get the latest payment status for an order.
   */
  @Get('status/:orderId')
  getPaymentStatus(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.getPaymentStatus(orderId, userId);
  }

  /**
   * Retry a failed or cancelled payment — generates a new token.
   */
  @Post('retry/:orderId')
  retryPayment(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.retryPayment(orderId, userId);
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC — webhook endpoints (no rate limiting — provider IPs)
  // ─────────────────────────────────────────────────────────────

  /**
   * Payme JSON-RPC webhook.
   * Body must be: { "jsonrpc": "2.0", "method": "...", "params": {...}, "id": 123 }
   * Authorization header: Basic base64('X-Auth:PAYME_KEY')
   */
  @Public()
  @SkipThrottle()
  @Post('webhook/payme')
  handlePaymeWebhook(
    @Body() body: { jsonrpc: string; method: string; params: Record<string, unknown>; id: number | string },
    @Headers('authorization') authHeader: string,
  ) {
    return this.paymentsService.handlePaymeRpc(
      body.method,
      body.params ?? {},
      authHeader,
      body.id,
    );
  }

  /**
   * Click Prepare — first step of Click two-step payment.
   */
  @Public()
  @SkipThrottle()
  @Post('webhook/click/prepare')
  handleClickPrepare(@Body() body: Record<string, unknown>) {
    return this.paymentsService.handleClickPrepare(body);
  }

  /**
   * Click Complete — second step of Click two-step payment.
   */
  @Public()
  @SkipThrottle()
  @Post('webhook/click/complete')
  handleClickComplete(@Body() body: Record<string, unknown>) {
    return this.paymentsService.handleClickComplete(body);
  }

  /**
   * Uzum REST webhook.
   * Expects X-Uzum-Signature header with HMAC-SHA256 of raw body.
   */
  @Public()
  @SkipThrottle()
  @Post('webhook/uzum')
  handleUzumWebhook(
    @Body() body: Record<string, unknown>,
    @Req() req: any,
    @Headers('x-uzum-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(body);
    return this.paymentsService.handleUzumWebhook(body, rawBody, signature ?? '');
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC — simulator (mock demo)
  // ─────────────────────────────────────────────────────────────

  /**
   * Get payment info for the simulator UI (read-only, no DB writes).
   */
  @Public()
  @Get('simulate/:token/info')
  getSimulatorInfo(@Param('token') token: string) {
    return this.paymentsService.getSimulatorInfo(token);
  }

  /**
   * Simulate a payment action (pay or cancel) from the mock UI.
   * Body: { action: 'pay' | 'cancel' }
   */
  @Public()
  @Post('simulate/:token')
  processSimulation(
    @Param('token') token: string,
    @Body('action') action: 'pay' | 'cancel',
  ) {
    return this.paymentsService.processSimulation(token, action);
  }

  // ─────────────────────────────────────────────────────────────
  // ADMIN endpoints
  // ─────────────────────────────────────────────────────────────

  /**
   * Admin: paginated list of all payment records.
   */
  @Get('admin/all')
  @Roles(RoleName.ADMIN)
  findAllPayments(@Query() query: PaginationQueryDto) {
    return this.paymentsService.findAllPayments(query);
  }

  /**
   * Admin: issue a refund for a completed payment.
   * Body: { reason: string }
   */
  @Post('admin/:orderId/refund')
  @Roles(RoleName.ADMIN)
  refundPayment(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthUser,
    @Body('reason') reason: string,
  ) {
    return this.paymentsService.refundPayment(orderId, user.id, reason ?? 'Admin refund');
  }
}
