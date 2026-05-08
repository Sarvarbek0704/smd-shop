import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;
  private fromAddress!: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('mail.host'),
      port: this.configService.getOrThrow<number>('mail.port'),
      secure: this.configService.getOrThrow<boolean>('mail.secure'),
      auth: {
        user: this.configService.getOrThrow<string>('mail.user'),
        pass: this.configService.getOrThrow<string>('mail.password'),
      },
    });

    const name = this.configService.getOrThrow<string>('mail.fromName');
    const address = this.configService.getOrThrow<string>('mail.fromAddress');
    this.fromAddress = `"${name}" <${address}>`;
  }

  async send(options: SendMailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(
        `Email yuborildi: ${options.to} (messageId=${info.messageId})`,
      );
    } catch (err) {
      this.logger.error(
        `Email yuborib bo'lmadi (${options.to}): ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Email manzilingizni tasdiqlang</h2>
        <p>Online Shop'da ro'yxatdan o'tganingiz uchun rahmat!</p>
        <p>Tasdiqlash kodingiz:</p>
        <div style="margin: 24px 0; text-align: center;">
          <span style="background:#f3f4f6;font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 32px;border-radius:8px;display:inline-block;">
            ${code}
          </span>
        </div>
        <p style="color:#666;font-size:14px;">
          Bu kodni saytdagi tasdiqlash maydoniga kiriting.
        </p>
        <p style="color:#999;font-size:13px;">
          Kod 24 soat amal qiladi. Agar siz ro'yxatdan o'tmagan bo'lsangiz,
          bu xabarni e'tiborsiz qoldiring.
        </p>
      </div>
    `;
    await this.send({ to, subject: `Tasdiqlash kodi: ${code}`, html });
  }

  async sendPasswordReset(to: string, link: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Parolni tiklash</h2>
        <p>Akkountingiz parolini tiklash so'rovi qabul qilindi.</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
            Yangi parol o'rnatish
          </a>
        </p>
        <p style="color:#666;font-size:14px;">
          Yoki shu havolani oching:<br>
          <a href="${link}">${link}</a>
        </p>
        <p style="color:#999;font-size:13px;">
          Havola 30 daqiqa amal qiladi. Agar siz bu so'rovni yubormagan bo'lsangiz,
          xabarni e'tiborsiz qoldiring.
        </p>
      </div>
    `;
    await this.send({ to, subject: 'Parolni tiklash', html });
  }
}
