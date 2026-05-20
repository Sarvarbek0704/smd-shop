import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomBytes } from 'crypto';

import { Payment } from '../../database/entities/payment.entity';
import { Order } from '../../database/entities/order.entity';
import {
  PaymentMethod,
  PaymentStatus,
  TransactionStatus,
  CancelReason,
} from '../../database/entities/enums';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResult } from '../../common/interfaces/paginated.interface';
import { buildPaginated } from '../../common/utils/paginate';

/** Shape stored in the in-memory token map */
interface TokenPayload {
  orderId: string;
  userId: string;
  provider: PaymentMethod;
  amount: number;
  expiresAt: Date;
}

/** Payme transaction state constants */
const PAYME_STATE = {
  CREATED: 1,
  COMPLETED: 2,
  CANCELLED_BEFORE: -1,
  CANCELLED_AFTER: -2,
} as const;

/** Payme JSON-RPC error codes */
const PAYME_ERROR = {
  WRONG_AMOUNT: -31001,
  ORDER_NOT_FOUND: -31050,
  WRONG_AUTH: -32504,
  TX_NOT_FOUND: -31003,
  UNABLE_TO_CANCEL: -31007,
  INTERNAL: -32400,
} as const;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  /** In-memory map: token → TokenPayload (15-minute expiry) */
  private readonly tokenStore = new Map<string, TokenPayload>();

  /** Cleanup interval handle */
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly config: ConfigService,
  ) {
    // Clean expired tokens every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanExpiredTokens(), 5 * 60 * 1000);
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────

  /**
   * Initiate payment for a given order.
   * Creates an in-memory token pointing to the order, returns simulator URL.
   */
  async initiatePayment(
    orderId: string,
    userId: string,
  ): Promise<{ paymentUrl: string; token: string; expiresAt: Date }> {
    const order = await this.findOrderForUser(orderId, userId);

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException("Bu buyurtma allaqachon to'langan");
    }
    if (order.paymentMethod === PaymentMethod.COD) {
      throw new BadRequestException(
        "Naqd to'lov uchun onlayn to'lov talab qilinmaydi",
      );
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    this.tokenStore.set(token, {
      orderId,
      userId,
      provider: order.paymentMethod,
      amount: parseFloat(order.finalAmount),
      expiresAt,
    });

    const baseUrl = this.config.get<string>('payment.simulatorBaseUrl');
    const paymentUrl = `${baseUrl}/payment/simulate/${token}`;

    this.logger.log(
      `Payment initiated: orderId=${orderId}, provider=${order.paymentMethod}, token=${token.slice(0, 8)}...`,
    );

    return { paymentUrl, token, expiresAt };
  }

  /**
   * Process a simulation action (pay or cancel) from the simulator UI.
   * Updates DB and order payment status accordingly.
   */
  async processSimulation(
    token: string,
    action: 'pay' | 'cancel',
  ): Promise<{ success: boolean; redirectUrl: string }> {
    const payload = this.validateToken(token);

    const order = await this.orderRepo.findOne({
      where: { id: payload.orderId },
    });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi');
    }

    const now = new Date();
    const externalTxId = `SIM-${randomBytes(8).toString('hex').toUpperCase()}`;

    if (action === 'pay') {
      const payment = this.paymentRepo.create({
        orderId: payload.orderId,
        provider: payload.provider,
        externalTxId,
        amount: String(payload.amount),
        status: TransactionStatus.SUCCESS,
        performedAt: now,
        payload: { simulatedAt: now.toISOString(), token: token.slice(0, 8) },
      });
      await this.paymentRepo.save(payment);

      order.paymentStatus = PaymentStatus.PAID;
      order.paymentTransactionId = payment.id;
      await this.orderRepo.save(order);

      this.logger.log(
        `Simulation PAY success: orderId=${payload.orderId}, paymentId=${payment.id}`,
      );
    } else {
      const payment = this.paymentRepo.create({
        orderId: payload.orderId,
        provider: payload.provider,
        externalTxId,
        amount: String(payload.amount),
        status: TransactionStatus.CANCELLED,
        cancelledAt: now,
        cancelReason: CancelReason.USER_CANCELLED,
        payload: { simulatedAt: now.toISOString(), action: 'cancel' },
      });
      await this.paymentRepo.save(payment);

      order.paymentStatus = PaymentStatus.CANCELLED;
      await this.orderRepo.save(order);

      this.logger.log(
        `Simulation CANCEL: orderId=${payload.orderId}`,
      );
    }

    this.tokenStore.delete(token);
    return { success: true, redirectUrl: `/orders/${payload.orderId}` };
  }

  /**
   * Return token info for the simulator UI (public, read-only).
   */
  getSimulatorInfo(
    token: string,
  ): { orderId: string; provider: string; amount: number; expiresAt: Date } {
    const payload = this.validateToken(token);
    return {
      orderId: payload.orderId,
      provider: payload.provider,
      amount: payload.amount,
      expiresAt: payload.expiresAt,
    };
  }

  /**
   * Return the latest payment record for an order (buyer access).
   */
  async getPaymentStatus(orderId: string, userId: string): Promise<Payment | null> {
    await this.findOrderForUser(orderId, userId);

    return this.paymentRepo.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retry a failed/cancelled payment — generates a new simulator token.
   */
  async retryPayment(
    orderId: string,
    userId: string,
  ): Promise<{ paymentUrl: string; token: string }> {
    const order = await this.findOrderForUser(orderId, userId);

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException("Buyurtma allaqachon to'langan");
    }

    const result = await this.initiatePayment(orderId, userId);
    return { paymentUrl: result.paymentUrl, token: result.token };
  }

  /**
   * Admin: refund a completed payment.
   */
  async refundPayment(
    orderId: string,
    adminId: string,
    reason: string,
  ): Promise<Payment> {
    this.logger.log(`Admin ${adminId} requested refund for order ${orderId}`);

    const payment = await this.paymentRepo.findOne({
      where: { orderId, status: TransactionStatus.SUCCESS },
      order: { createdAt: 'DESC' },
    });

    if (!payment) {
      throw new NotFoundException(
        "Bu buyurtma uchun muvaffaqiyatli to'lov topilmadi",
      );
    }

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi');
    }

    payment.status = TransactionStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.cancelReason = CancelReason.REFUND_REQUESTED;
    payment.payload = {
      ...(payment.payload ?? {}),
      refundReason: reason,
      refundedBy: adminId,
    };
    await this.paymentRepo.save(payment);

    order.paymentStatus = PaymentStatus.REFUNDED;
    await this.orderRepo.save(order);

    this.logger.log(
      `Refund processed: orderId=${orderId}, paymentId=${payment.id}`,
    );

    return payment;
  }

  /**
   * Admin: paginated list of all payments.
   */
  async findAllPayments(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Payment>> {
    const { page, limit } = query;
    const [data, total] = await this.paymentRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['order'],
    });
    return buildPaginated(data, total, page, limit);
  }

  // ─────────────────────────────────────────────────────────────
  // PAYME JSON-RPC
  // ─────────────────────────────────────────────────────────────

  /**
   * Main entry point for Payme JSON-RPC requests.
   * Verifies Basic Auth, then dispatches to the correct method handler.
   */
  async handlePaymeRpc(
    method: string,
    params: Record<string, unknown>,
    authHeader: string,
    rpcId: number | string,
  ): Promise<unknown> {
    this.verifyPaymeAuth(authHeader, rpcId);

    this.logger.log(`Payme RPC: method=${method}`);

    switch (method) {
      case 'CheckPerformTransaction':
        return this.paymeCheckPerform(params, rpcId);
      case 'CreateTransaction':
        return this.paymeCreateTransaction(params, rpcId);
      case 'PerformTransaction':
        return this.paymePerformTransaction(params, rpcId);
      case 'CancelTransaction':
        return this.paymeCancelTransaction(params, rpcId);
      case 'CheckTransaction':
        return this.paymeCheckTransaction(params, rpcId);
      case 'GetStatement':
        return this.paymeGetStatement(params, rpcId);
      default:
        return this.paymeError(
          -32601,
          'Method not found',
          'Metod topilmadi',
          null,
          rpcId,
        );
    }
  }

  /** CheckPerformTransaction — verify order exists and amount matches */
  private async paymeCheckPerform(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<unknown> {
    const account = params['account'] as Record<string, string> | undefined;
    const orderId = account?.['order_id'];
    const amount = params['amount'] as number | undefined;

    if (!orderId) {
      return this.paymeError(
        PAYME_ERROR.ORDER_NOT_FOUND,
        "Buyurtma ID ko'rsatilmagan",
        'ID заказа не указан',
        'order_id',
        id,
      );
    }

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      return this.paymeError(
        PAYME_ERROR.ORDER_NOT_FOUND,
        'Buyurtma topilmadi',
        'Заказ не найден',
        'order_id',
        id,
      );
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return this.paymeError(
        PAYME_ERROR.WRONG_AMOUNT,
        "Buyurtma allaqachon to'langan",
        'Заказ уже оплачен',
        'order_id',
        id,
      );
    }

    // Payme sends amount in tiyin (1 UZS = 100 tiyin)
    const expectedTiyin = Math.round(parseFloat(order.finalAmount) * 100);
    if (amount !== expectedTiyin) {
      return this.paymeError(
        PAYME_ERROR.WRONG_AMOUNT,
        "To'lov miqdori noto'g'ri",
        'Неверная сумма оплаты',
        'amount',
        id,
      );
    }

    return { jsonrpc: '2.0', id, result: { allow: true } };
  }

  /** CreateTransaction — create or return existing pending payment */
  private async paymeCreateTransaction(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<unknown> {
    const account = params['account'] as Record<string, string> | undefined;
    const orderId = account?.['order_id'];
    const externalTxId = params['id'] as string | undefined;
    const amount = params['amount'] as number | undefined;

    if (!orderId || !externalTxId || amount === undefined) {
      return this.paymeError(
        PAYME_ERROR.INTERNAL,
        "Majburiy parametrlar yetishmayapti",
        'Отсутствуют обязательные параметры',
        null,
        id,
      );
    }

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      return this.paymeError(
        PAYME_ERROR.ORDER_NOT_FOUND,
        'Buyurtma topilmadi',
        'Заказ не найден',
        'order_id',
        id,
      );
    }

    // Check if transaction already exists
    let payment = await this.paymentRepo.findOne({
      where: { externalTxId },
    });

    if (payment) {
      if (payment.status === TransactionStatus.CANCELLED) {
        return this.paymeError(
          PAYME_ERROR.UNABLE_TO_CANCEL,
          "Bekor qilingan tranzaksiyani qayta ochib bo'lmaydi",
          'Невозможно повторно открыть отменённую транзакцию',
          'id',
          id,
        );
      }
      return {
        jsonrpc: '2.0',
        id,
        result: {
          create_time: payment.createdAt.getTime(),
          transaction: payment.id,
          state: PAYME_STATE.CREATED,
          receivers: null,
        },
      };
    }

    // Create new payment record
    payment = this.paymentRepo.create({
      orderId,
      provider: PaymentMethod.PAYME,
      externalTxId,
      amount: String(amount / 100), // store in UZS
      status: TransactionStatus.PROCESSING,
      payload: { paymeParams: params },
    });
    await this.paymentRepo.save(payment);

    this.logger.log(
      `Payme CreateTransaction: orderId=${orderId}, externalTxId=${externalTxId}`,
    );

    return {
      jsonrpc: '2.0',
      id,
      result: {
        create_time: payment.createdAt.getTime(),
        transaction: payment.id,
        state: PAYME_STATE.CREATED,
        receivers: null,
      },
    };
  }

  /** PerformTransaction — complete payment, mark order as paid */
  private async paymePerformTransaction(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<unknown> {
    const externalTxId = params['id'] as string | undefined;

    const payment = await this.paymentRepo.findOne({
      where: { externalTxId },
    });
    if (!payment) {
      return this.paymeError(
        PAYME_ERROR.TX_NOT_FOUND,
        'Tranzaksiya topilmadi',
        'Транзакция не найдена',
        'id',
        id,
      );
    }

    if (payment.status === TransactionStatus.CANCELLED) {
      return this.paymeError(
        PAYME_ERROR.UNABLE_TO_CANCEL,
        "Bekor qilingan tranzaksiyani bajarib bo'lmaydi",
        'Невозможно выполнить отменённую транзакцию',
        'id',
        id,
      );
    }

    if (payment.status === TransactionStatus.SUCCESS) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          transaction: payment.id,
          perform_time: payment.performedAt!.getTime(),
          state: PAYME_STATE.COMPLETED,
        },
      };
    }

    const now = new Date();
    payment.status = TransactionStatus.SUCCESS;
    payment.performedAt = now;
    await this.paymentRepo.save(payment);

    const order = await this.orderRepo.findOne({ where: { id: payment.orderId } });
    if (order) {
      order.paymentStatus = PaymentStatus.PAID;
      order.paymentTransactionId = payment.id;
      await this.orderRepo.save(order);
    }

    this.logger.log(
      `Payme PerformTransaction SUCCESS: orderId=${payment.orderId}, paymentId=${payment.id}`,
    );

    return {
      jsonrpc: '2.0',
      id,
      result: {
        transaction: payment.id,
        perform_time: now.getTime(),
        state: PAYME_STATE.COMPLETED,
      },
    };
  }

  /** CancelTransaction — cancel before or after payment */
  private async paymeCancelTransaction(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<unknown> {
    const externalTxId = params['id'] as string | undefined;
    const reason = params['reason'] as number | undefined;

    const payment = await this.paymentRepo.findOne({
      where: { externalTxId },
    });
    if (!payment) {
      return this.paymeError(
        PAYME_ERROR.TX_NOT_FOUND,
        'Tranzaksiya topilmadi',
        'Транзакция не найдена',
        'id',
        id,
      );
    }

    const wasPerformed = payment.status === TransactionStatus.SUCCESS;
    const now = new Date();

    payment.status = TransactionStatus.CANCELLED;
    payment.cancelledAt = now;
    payment.cancelReason = CancelReason.PROVIDER_DECLINED;
    payment.payload = {
      ...(payment.payload ?? {}),
      paymeReason: reason,
    };
    await this.paymentRepo.save(payment);

    const order = await this.orderRepo.findOne({ where: { id: payment.orderId } });
    if (order) {
      order.paymentStatus = PaymentStatus.CANCELLED;
      await this.orderRepo.save(order);
    }

    this.logger.log(
      `Payme CancelTransaction: orderId=${payment.orderId}, wasPerformed=${wasPerformed}`,
    );

    return {
      jsonrpc: '2.0',
      id,
      result: {
        transaction: payment.id,
        cancel_time: now.getTime(),
        state: wasPerformed ? PAYME_STATE.CANCELLED_AFTER : PAYME_STATE.CANCELLED_BEFORE,
      },
    };
  }

  /** CheckTransaction — return current state of a transaction */
  private async paymeCheckTransaction(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<unknown> {
    const externalTxId = params['id'] as string | undefined;

    const payment = await this.paymentRepo.findOne({
      where: { externalTxId },
    });
    if (!payment) {
      return this.paymeError(
        PAYME_ERROR.TX_NOT_FOUND,
        'Tranzaksiya topilmadi',
        'Транзакция не найдена',
        'id',
        id,
      );
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        create_time: payment.createdAt.getTime(),
        perform_time: payment.performedAt?.getTime() ?? 0,
        cancel_time: payment.cancelledAt?.getTime() ?? 0,
        transaction: payment.id,
        state: this.mapStatusToPaymeState(payment.status),
        reason: payment.cancelReason ?? null,
      },
    };
  }

  /** GetStatement — return all transactions in a time range */
  private async paymeGetStatement(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<unknown> {
    const from = params['from'] as number | undefined;
    const to = params['to'] as number | undefined;

    if (!from || !to) {
      return this.paymeError(
        PAYME_ERROR.INTERNAL,
        "Sana parametrlari yetishmayapti",
        'Отсутствуют параметры дат',
        null,
        id,
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const payments = await this.paymentRepo.find({
      where: {
        provider: PaymentMethod.PAYME,
        createdAt: Between(fromDate, toDate),
      },
      order: { createdAt: 'ASC' },
    });

    const transactions = payments.map((p) => ({
      id: p.externalTxId,
      time: p.createdAt.getTime(),
      amount: Math.round(parseFloat(p.amount) * 100), // back to tiyin
      account: { order_id: p.orderId },
      create_time: p.createdAt.getTime(),
      perform_time: p.performedAt?.getTime() ?? 0,
      cancel_time: p.cancelledAt?.getTime() ?? 0,
      transaction: p.id,
      state: this.mapStatusToPaymeState(p.status),
      reason: p.cancelReason ?? null,
      receivers: null,
    }));

    return { jsonrpc: '2.0', id, result: { transactions } };
  }

  /** Map our TransactionStatus to Payme state integer */
  private mapStatusToPaymeState(status: TransactionStatus): number {
    switch (status) {
      case TransactionStatus.PROCESSING:
        return PAYME_STATE.CREATED;
      case TransactionStatus.SUCCESS:
        return PAYME_STATE.COMPLETED;
      case TransactionStatus.CANCELLED:
        return PAYME_STATE.CANCELLED_BEFORE;
      case TransactionStatus.REFUNDED:
        return PAYME_STATE.CANCELLED_AFTER;
      default:
        return PAYME_STATE.CANCELLED_BEFORE;
    }
  }

  /** Verify Payme Basic Auth header: Basic base64('X-Auth:PAYME_KEY') */
  private verifyPaymeAuth(
    authHeader: string,
    rpcId: number | string,
  ): void {
    const key = this.config.get<string>('payment.paymeKey');
    const expected = Buffer.from(`X-Auth:${key}`).toString('base64');
    const provided = authHeader?.replace(/^Basic\s+/i, '').trim();

    if (provided !== expected) {
      throw new UnauthorizedException('Noto\'g\'ri Payme autentifikatsiya kaliti');
    }
  }

  /** Build a Payme-style JSON-RPC error response */
  private paymeError(
    code: number,
    uz: string,
    ru: string,
    data: string | null,
    id: number | string,
  ): unknown {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message: { uz, ru },
        data,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CLICK TWO-STEP
  // ─────────────────────────────────────────────────────────────

  /**
   * Click Prepare — first step of Click payment.
   * Verifies sign, checks order, creates pending payment record.
   */
  async handleClickPrepare(
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const secret = this.config.get<string>('payment.clickSecret');
    const serviceId = this.config.get<string>('payment.clickMerchantId');

    const {
      click_trans_id,
      merchant_trans_id: orderId,
      amount,
      action,
      sign_time,
      sign_string,
    } = body as Record<string, string>;

    const expectedSign = this.clickMd5(
      `${click_trans_id}${serviceId}${secret}${orderId}${amount}${action}${sign_time}`,
    );

    if (expectedSign !== sign_string) {
      this.logger.warn(`Click Prepare: invalid sign for orderId=${orderId}`);
      return { error: -1, error_note: 'Noto\'g\'ri imzo (sign)' };
    }

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      return { error: -5, error_note: 'Buyurtma topilmadi' };
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return { error: -4, error_note: "Buyurtma allaqachon to'langan" };
    }

    const expectedAmount = parseFloat(order.finalAmount);
    const receivedAmount = parseFloat(amount);
    if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
      return { error: -2, error_note: "Miqdor noto'g'ri" };
    }

    const payment = this.paymentRepo.create({
      orderId,
      provider: PaymentMethod.CLICK,
      externalTxId: `CLICK-${click_trans_id}`,
      amount: String(receivedAmount),
      status: TransactionStatus.PROCESSING,
      payload: { clickPrepare: body },
    });
    await this.paymentRepo.save(payment);

    this.logger.log(
      `Click Prepare OK: orderId=${orderId}, click_trans_id=${click_trans_id}`,
    );

    return {
      click_trans_id,
      merchant_trans_id: orderId,
      merchant_prepare_id: payment.id,
      error: 0,
      error_note: 'Success',
    };
  }

  /**
   * Click Complete — second step of Click payment.
   * Verifies sign + status, completes or cancels payment.
   */
  async handleClickComplete(
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const secret = this.config.get<string>('payment.clickSecret');
    const serviceId = this.config.get<string>('payment.clickMerchantId');

    const {
      click_trans_id,
      merchant_trans_id: orderId,
      merchant_prepare_id,
      amount,
      action,
      sign_time,
      sign_string,
      error: clickError,
    } = body as Record<string, string>;

    const expectedSign = this.clickMd5(
      `${click_trans_id}${serviceId}${secret}${orderId}${merchant_prepare_id}${amount}${action}${sign_time}`,
    );

    if (expectedSign !== sign_string) {
      this.logger.warn(`Click Complete: invalid sign for orderId=${orderId}`);
      return { error: -1, error_note: 'Noto\'g\'ri imzo (sign)' };
    }

    const payment = await this.paymentRepo.findOne({
      where: { id: merchant_prepare_id },
    });
    if (!payment) {
      return { error: -6, error_note: 'Tranzaksiya topilmadi' };
    }

    const clickErrCode = parseInt(clickError ?? '0', 10);
    const now = new Date();

    if (clickErrCode < 0) {
      // Click reported an error — cancel
      payment.status = TransactionStatus.CANCELLED;
      payment.cancelledAt = now;
      payment.cancelReason = CancelReason.PROVIDER_DECLINED;
      payment.payload = {
        ...(payment.payload ?? {}),
        clickComplete: body,
      };
      await this.paymentRepo.save(payment);

      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (order) {
        order.paymentStatus = PaymentStatus.CANCELLED;
        await this.orderRepo.save(order);
      }

      return { error: 0, error_note: 'Success' };
    }

    // Complete successfully
    payment.status = TransactionStatus.SUCCESS;
    payment.performedAt = now;
    payment.payload = { ...(payment.payload ?? {}), clickComplete: body };
    await this.paymentRepo.save(payment);

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (order) {
      order.paymentStatus = PaymentStatus.PAID;
      order.paymentTransactionId = payment.id;
      await this.orderRepo.save(order);
    }

    this.logger.log(
      `Click Complete SUCCESS: orderId=${orderId}, paymentId=${payment.id}`,
    );

    return {
      click_trans_id,
      merchant_trans_id: orderId,
      merchant_confirm_id: payment.id,
      error: 0,
      error_note: 'Success',
    };
  }

  /** Compute MD5 hash for Click sign verification */
  private clickMd5(input: string): string {
    return createHash('md5').update(input).digest('hex');
  }

  // ─────────────────────────────────────────────────────────────
  // UZUM REST WEBHOOK
  // ─────────────────────────────────────────────────────────────

  /**
   * Uzum webhook handler.
   * Verifies HMAC-SHA256 signature, then processes the event.
   */
  async handleUzumWebhook(
    body: Record<string, unknown>,
    rawBody: string,
    signature: string,
  ): Promise<Record<string, unknown>> {
    const secret = this.config.getOrThrow<string>('payment.uzumSecret');
    const expectedSig = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSig !== signature) {
      this.logger.warn('Uzum webhook: invalid signature');
      return { status: 'error', message: 'Noto\'g\'ri imzo' };
    }

    const eventType = body['event'] as string | undefined;
    const transactionId = body['transactionId'] as string | undefined;
    const orderId = body['merchantOrderId'] as string | undefined;
    const amountRaw = body['amount'] as number | undefined;
    const status = body['status'] as string | undefined;

    this.logger.log(
      `Uzum webhook: event=${eventType}, orderId=${orderId}, txId=${transactionId}`,
    );

    if (!orderId) {
      return { status: 'error', message: 'merchantOrderId yetishmayapti' };
    }

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      return { status: 'error', message: 'Buyurtma topilmadi' };
    }

    const now = new Date();
    const amount = amountRaw ? amountRaw / 100 : parseFloat(order.finalAmount);
    const externalTxId = transactionId
      ? `UZUM-${transactionId}`
      : `UZUM-${randomBytes(8).toString('hex')}`;

    if (eventType === 'PAYMENT_SUCCESS' || status === 'SUCCESS') {
      let payment = await this.paymentRepo.findOne({ where: { externalTxId } });

      if (!payment) {
        payment = this.paymentRepo.create({
          orderId,
          provider: PaymentMethod.UZUM,
          externalTxId,
          amount: String(amount),
          status: TransactionStatus.SUCCESS,
          performedAt: now,
          payload: { uzumWebhook: body },
        });
      } else {
        payment.status = TransactionStatus.SUCCESS;
        payment.performedAt = now;
      }
      await this.paymentRepo.save(payment);

      order.paymentStatus = PaymentStatus.PAID;
      order.paymentTransactionId = payment.id;
      await this.orderRepo.save(order);

      this.logger.log(
        `Uzum PAYMENT_SUCCESS: orderId=${orderId}, paymentId=${payment.id}`,
      );
    } else if (eventType === 'PAYMENT_CANCELLED' || status === 'CANCELLED') {
      let payment = await this.paymentRepo.findOne({ where: { externalTxId } });

      if (!payment) {
        payment = this.paymentRepo.create({
          orderId,
          provider: PaymentMethod.UZUM,
          externalTxId,
          amount: String(amount),
          status: TransactionStatus.CANCELLED,
          cancelledAt: now,
          cancelReason: CancelReason.PROVIDER_DECLINED,
          payload: { uzumWebhook: body },
        });
      } else {
        payment.status = TransactionStatus.CANCELLED;
        payment.cancelledAt = now;
      }
      await this.paymentRepo.save(payment);

      order.paymentStatus = PaymentStatus.CANCELLED;
      await this.orderRepo.save(order);
    }

    return { status: 'ok' };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Find an order and verify the requesting user is the buyer.
   */
  private async findOrderForUser(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi');
    }
    if (order.buyerId !== userId) {
      throw new BadRequestException("Bu buyurtma sizga tegishli emas");
    }
    return order;
  }

  /**
   * Validate a simulator token: existence + expiry.
   * Throws BadRequestException if invalid or expired.
   */
  private validateToken(token: string): TokenPayload {
    const payload = this.tokenStore.get(token);
    if (!payload) {
      throw new BadRequestException(
        "To'lov tokeni topilmadi yoki muddati tugagan",
      );
    }
    if (new Date() > payload.expiresAt) {
      this.tokenStore.delete(token);
      throw new BadRequestException("To'lov tokenining muddati tugagan");
    }
    return payload;
  }

  /** Remove all expired tokens from the in-memory map */
  private cleanExpiredTokens(): void {
    const now = new Date();
    let removed = 0;
    for (const [token, payload] of this.tokenStore.entries()) {
      if (now > payload.expiresAt) {
        this.tokenStore.delete(token);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.debug(`Cleaned ${removed} expired payment token(s)`);
    }
  }

  /** Cleanup on module destroy */
  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
