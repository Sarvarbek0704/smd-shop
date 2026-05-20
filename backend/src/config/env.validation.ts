import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string().uri().required(),
  DATABASE_URL: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(true),

  // DB_HOST: Joi.string().required(),
  // DB_PORT: Joi.number().default(5432),
  // DB_USERNAME: Joi.string().required(),
  // DB_PASSWORD: Joi.string().required(),
  // DB_DATABASE: Joi.string().required(),
  // DB_SYNCHRONIZE: Joi.boolean().default(false),
  // DB_LOGGING: Joi.boolean().default(true),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES: Joi.string().default('30d'),

  // Mail
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().default(587),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_USER: Joi.string().required(),
  MAIL_PASSWORD: Joi.string().required(),
  MAIL_FROM_NAME: Joi.string().required(),
  MAIL_FROM_ADDRESS: Joi.string().email().required(),

  // OTP
  OTP_LENGTH: Joi.number().integer().min(4).max(8).default(6),
  OTP_EXPIRES_MINUTES: Joi.number().integer().min(1).default(5),
  OTP_RESEND_COOLDOWN_SECONDS: Joi.number().integer().min(0).default(60),
  OTP_MAX_ATTEMPTS: Joi.number().integer().min(1).default(5),

  // Verification & Reset
  EMAIL_VERIFICATION_EXPIRES_HOURS: Joi.number().integer().min(1).default(24),
  PASSWORD_RESET_EXPIRES_MINUTES: Joi.number().integer().min(1).default(30),

  // Uploads
  UPLOAD_DIR: Joi.string().default('./uploads'),
  UPLOAD_MAX_FILE_SIZE: Joi.number().default(5242880),
  UPLOAD_MAX_FILES: Joi.number().integer().default(10),
  UPLOAD_ALLOWED_MIMES: Joi.string().default(
    'image/jpeg,image/png,image/webp,image/gif',
  ),
});
