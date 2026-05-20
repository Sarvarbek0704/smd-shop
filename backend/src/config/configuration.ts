export default () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT ?? '3000', 10),
  frontendUrl: process.env.FRONTEND_URL,

  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES,
  },

  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    fromName: process.env.MAIL_FROM_NAME,
    fromAddress: process.env.MAIL_FROM_ADDRESS,
  },

  otp: {
    length: parseInt(process.env.OTP_LENGTH ?? '6', 10),
    expiresMinutes: parseInt(process.env.OTP_EXPIRES_MINUTES ?? '5', 10),
    resendCooldownSeconds: parseInt(
      process.env.OTP_RESEND_COOLDOWN_SECONDS ?? '60',
      10,
    ),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
  },

  verification: {
    emailExpiresHours: parseInt(
      process.env.EMAIL_VERIFICATION_EXPIRES_HOURS ?? '24',
      10,
    ),
    passwordResetExpiresMinutes: parseInt(
      process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? '30',
      10,
    ),
  },
  upload: {
    dir: process.env.UPLOAD_DIR ?? './uploads',
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE ?? '5242880', 10),
    maxFiles: parseInt(process.env.UPLOAD_MAX_FILES ?? '10', 10),
    allowedMimes: (
      process.env.UPLOAD_ALLOWED_MIMES ??
      'image/jpeg,image/png,image/webp,image/gif'
    ).split(','),
  },

  payment: {
    paymeKey: process.env.PAYME_KEY ?? 'test_payme_secret_key_mock_32chars',
    paymeId: process.env.PAYME_MERCHANT_ID ?? 'mock_payme_merchant',
    clickSecret: process.env.CLICK_SECRET ?? 'test_click_secret_mock',
    clickMerchantId: process.env.CLICK_MERCHANT_ID ?? 'mock_click_merchant',
    uzumSecret: process.env.UZUM_SECRET ?? 'test_uzum_secret_mock',
    simulatorBaseUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  },
});
