# SMD Shop — Full-Stack Online Do'kon

O'zbekiston bozori uchun ishlab chiqilgan to'liq funksional e-commerce platforma.  
**NestJS 11 + React 19 + PostgreSQL (Neon) + RTK Query**

---

## Mundarija

- [Texnologiyalar](#texnologiyalar)
- [Arxitektura](#arxitektura)
- [Tez ishga tushirish](#tez-ishga-tushirish)
- [Muhit sozlamalari (.env)](#muhit-sozlamalari)
- [Ma'lumotlar bazasi](#malumotlar-bazasi)
- [Seed (Demo ma'lumotlar)](#seed-demo-malumotlar)
- [Demo hisoblar](#demo-hisoblar)
- [API hujjatlari](#api-hujjatlari)
- [Rollar va ruxsatlar](#rollar-va-ruxsatlar)
- [To'lov tizimi](#tolov-tizimi)
- [Modullar ro'yxati](#modullar-royxati)
- [Papka strukturasi](#papka-strukturasi)

---

## Texnologiyalar

### Backend
| Texnologiya | Versiya | Maqsad |
|---|---|---|
| NestJS | 11 | Asosiy framework |
| TypeORM | 0.3 | ORM (PostgreSQL bilan) |
| PostgreSQL (Neon) | 16 | Ma'lumotlar bazasi |
| JWT (access + refresh) | — | Autentifikatsiya |
| bcrypt | 6 | Parol shifrlash |
| Multer + Sharp | — | Rasm yuklash va optimallashtirish |
| Socket.io | 4 | Real-vaqt chat |
| @nestjs/throttler | 6 | Rate limiting |
| Helmet | 8 | HTTP xavfsizlik headerlari |
| Nodemailer | 8 | Email jo'natish |
| Swagger | 11 | API hujjatlari |
| class-validator | 0.15 | DTO validatsiya |

### Frontend
| Texnologiya | Versiya | Maqsad |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.7 | Type safety |
| Vite | 6 | Build tool |
| Redux Toolkit + RTK Query | 2 | State va API boshqaruv |
| React Router | 7 | Routing |
| Tailwind CSS | 4 | Stillar |
| Framer Motion | 12 | Animatsiyalar |
| react-hook-form + Zod | — | Formalar va validatsiya |
| react-hot-toast | — | Bildirishnomalar |
| Lucide React | — | Ikonkalar |

---

## Arxitektura

```
online-shop_2/
├── backend/          # NestJS API serveri (port 3000)
└── frontend/         # React SPA (port 5173, Vite dev server)
```

### API oqimi
```
Frontend (RTK Query)
    ↓ HTTP /api/*
Vite proxy → NestJS (port 3000)
    ↓
ThrottlerGuard → JwtAuthGuard → DemoGuard → RolesGuard
    ↓
Controller → Service → TypeORM → Neon PostgreSQL
    ↓
ResponseInterceptor: { success, data, message, statusCode }
    ↓
RTK Query apiSlice (data unwrap qilinadi)
```

### Autentifikatsiya
- **Access token** — 1 kun, JWT (Bearer)
- **Refresh token** — 30 kun, opaque token (DB da saqlangan, hash ko'rinishida)
- **Token rotation** — har refresh da yangi juft beriladi, eskilari bekor qilinadi
- **401** → `baseQueryWithReauth` avtomatik refresh qiladi, kerak bo'lsa logout

---

## Tez ishga tushirish

### Talablar
- Node.js ≥ 18
- npm ≥ 9
- Internet (Neon cloud DB uchun)

### 1. Repozitoriyni klonlash
```bash
git clone <repo-url>
cd online-shop_2
```

### 2. Backend sozlash
```bash
cd backend
npm install
```

`.env` fayl allaqachon sozlangan (Neon DB bilan). Agar kerak bo'lsa ko'ring:
```bash
cat .env
```

### 3. Frontend sozlash
```bash
cd ../frontend
npm install
```

### 4. Ma'lumotlar bazasini va seed ni ishga tushirish
```bash
cd ../backend

# Jadvallar avtomatik yaratiladi (DB_SYNCHRONIZE=true)
# Seed — demo ma'lumotlarni yuklash:
npm run seed
```

### 5. Serverni ishga tushirish

**Terminal 1 — Backend:**
```bash
cd backend
npm run start:dev
# → http://localhost:3000
# → Swagger: http://localhost:3000/api/docs
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

### 6. Brauzerda ochish
```
http://localhost:5173
```

---

## Muhit sozlamalari

`backend/.env` fayli:

```env
# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database — Neon PostgreSQL
DATABASE_URL=postgresql://neondb_owner:...@ep-holy-feather-...neon.tech/neondb?sslmode=require

# DB_SYNCHRONIZE=true — jadvallar avtomatik yaratiladi (dev uchun)
DB_SYNCHRONIZE=true
DB_LOGGING=false

# JWT
JWT_ACCESS_SECRET=SMD_shop_ACCESS_KEY_...
JWT_REFRESH_SECRET=SMD_shop_REFRESH_KEY_...
JWT_ACCESS_EXPIRES=1d
JWT_REFRESH_EXPIRES=30d

# Mail — Gmail App Password
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=coolsarvar2007@gmail.com
MAIL_PASSWORD=vezuuquwtovjsjbq

# OTP
OTP_LENGTH=6
OTP_EXPIRES_MINUTES=5
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_ATTEMPTS=5

# Payment (Mock/Demo)
PAYME_KEY=test_payme_secret_key_mock_32chars_smd
CLICK_SECRET=test_click_secret_mock_smd
UZUM_SECRET=test_uzum_secret_mock_smd
```

> **Muhim:** `DATABASE_URL` mavjud bo'lsa, `DB_HOST/DB_PORT/...` e'tiborga olinmaydi.  
> Neon ulanishi SSL talab qiladi — bu avtomatik sozlangan.

---

## Ma'lumotlar bazasi

### Jadvallar (TypeORM entities)
| Jadval | Tavsif |
|---|---|
| `users` | Foydalanuvchilar (isDemo flag bilan) |
| `roles` | Rollar (admin, seller, buyer, delivery) |
| `user_roles` | Ko'p-ko'p jadval |
| `categories` | Daraxli kategoriyalar (closure table) |
| `products` | Mahsulotlar |
| `product_variants` | Variant (rang, o'lcham, xotira) |
| `product_images` | Mahsulot rasmlari |
| `product_views` | Ko'rishlar tarixi |
| `carts` | Savatcha (couponCode bilan) |
| `cart_items` | Savatcha elementlari |
| `orders` | Buyurtmalar |
| `order_items` | Buyurtma elementlari (snapshot narx bilan) |
| `order_status_history` | Holat o'zgarish tarixi |
| `deliveries` | Yetkazib berish yozuvlari |
| `payments` | To'lov tranzaksiyalari |
| `reviews` | Mahsulot sharhlari |
| `coupons` | Chegirma kuponlari |
| `wishlist` | Sevimlilar |
| `notifications` | Bildirishnomalar |
| `chat_rooms` | Chat xonalari |
| `chat_messages` | Chat xabarlari |
| `refresh_tokens` | JWT refresh tokenlar |
| `email_verifications` | Email tasdiqlash tokenlar |
| `password_resets` | Parol tiklash tokenlar |
| `phone_otps` | Telefon OTP kodlar |

### TypeORM migratsiyalari
```bash
# Migratsiya yaratish
npm run migration:generate -- src/database/migrations/MigrationName

# Migratsiyani ishlatish
npm run migration:run

# Ortga qaytarish
npm run migration:revert
```

> Production'da `DB_SYNCHRONIZE=false` qo'yib, migratsiyalar bilan ishlash tavsiya etiladi.

---

## Seed (Demo ma'lumotlar)

```bash
cd backend
npm run seed
```

Seed nima yaratadi:

### Foydalanuvchilar
| Email | Parol | Rol | Izoh |
|---|---|---|---|
| `admin@smd.uz` | `Shop12345!` | Admin | Real admin |
| `techzone@smd.uz` | `Shop12345!` | Seller | TechZone do'koni |
| `fashionhub@smd.uz` | `Shop12345!` | Seller | FashionHub do'koni |
| `homestyle@smd.uz` | `Shop12345!` | Seller | HomeStyle do'koni |
| `alisher@smd.uz` | `Shop12345!` | Buyer | Real xaridor |
| `kamola@smd.uz` | `Shop12345!` | Buyer | Real xaridor |
| `sherzod@smd.uz` | `Shop12345!` | Buyer | Real xaridor |
| `dilnoza@smd.uz` | `Shop12345!` | Buyer | Real xaridor |
| `ulugbek@smd.uz` | `Shop12345!` | Buyer | Real xaridor |
| `courier@smd.uz` | `Shop12345!` | Delivery | Real kuryer |

### Kategoriyalar (17 ta)
- **Elektronika:** Smartfonlar, Noutbuklar, Audio & Video, Aksessuarlar
- **Kiyim & Moda:** Erkaklar kiyimi, Ayollar kiyimi, Bolalar kiyimi, Sport kiyimlari
- **Uy & Bog':** Mebel, Oshxona buyumlari, Bezatish
- **Sport & Fitnes:** Fitnes uskunalari, Velosipedlar

### Mahsulotlar (21 ta)
- iPhone 15 Pro Max, Samsung Galaxy S24 Ultra, Xiaomi 14 Ultra, OnePlus 12
- MacBook Pro 14" M3 Pro, Dell XPS 15, ASUS ROG Zephyrus G16
- AirPods Pro 2, Sony WH-1000XM5, Anker MagSafe 3-in-1
- Erkaklar ko'ylagi, Chino shim, Nike Dri-FIT t-shirt
- Skandinav ish stoli, Ergonomik kreslo
- Tefal Airfryer XXL, Tefal Ingenio qozon to'plami
- Aromatik sham to'plami, Adjustable Dumbbell Set

### Buyurtmalar (14 ta, turli statuslar)
`delivered`, `shipped`, `processing`, `confirmed`, `pending`, `cancelled`, `refunded`

### Kuponlar
| Kod | Tur | Chegirma | Shart |
|---|---|---|---|
| `WELCOME10` | Foiz | 10% | — |
| `SUMMER25` | Foiz | 25% | Min 500,000 so'm, max 300,000 so'm chegirma |
| `TECH50K` | Belgilangan | 50,000 so'm | Min 300,000 so'm |
| `VIP500K` | Belgilangan | 500,000 so'm | Min 5,000,000 so'm |

---

## Demo hisoblar

Demo hisoblar faqat **ko'rish** rejimida ishlaydi.  
Har qanday o'zgartirish (buyurtma berish, mahsulot qo'shish va h.k.) **403 Forbidden** qaytaradi.

| Rol | Email | Parol |
|---|---|---|
| 👑 Admin | `demo.admin@smd.uz` | `Demo12345!` |
| 🏪 Seller | `demo.seller@smd.uz` | `Demo12345!` |
| 👤 Buyer | `demo.user@smd.uz` | `Demo12345!` |

Demo hisoblar bilan nima qilsa bo'ladi:
- ✅ Saytni ko'rish, mahsulotlarni ko'rish
- ✅ Admin panelni ko'rish (barcha statistika, buyurtmalar, foydalanuvchilar)
- ✅ Seller dashboardini ko'rish (buyurtmalar, analitika, sharhlar)
- ✅ Savatni ko'rish
- ❌ Buyurtma berish
- ❌ Mahsulot qo'shish / tahrirlash
- ❌ Profil yangilash
- ❌ Sharh yozish
- ❌ Har qanday ma'lumot o'zgartirish

---

## API hujjatlari

Swagger UI (backend ishga tushganda):
```
http://localhost:3000/api/docs
```

### Asosiy endpoint guruhlari

| Guruh | Prefix | Tavsif |
|---|---|---|
| Auth | `/api/auth` | Login, register, refresh, logout, OTP |
| Users | `/api/users` | Profil, parol, avatar, sellerlar ro'yxati |
| Categories | `/api/categories` | CRUD kategoriyalar (admin) |
| Products | `/api/products` | CRUD, qidiruv, filter, ko'rishlar |
| Cart | `/api/cart` | Savatcha, kupon qo'shish/olib tashlash |
| Orders | `/api/orders` | Buyurtma berish, holat kuzatish, bekor qilish |
| Payments | `/api/payments` | To'lov boshlash, webhook, simulator |
| Reviews | `/api/reviews` | Sharh yozish, o'qish, tasdiqlash (admin) |
| Coupons | `/api/coupons` | CRUD (admin), validatsiya |
| Delivery | `/api/delivery` | Kuryer topshiriqlari, holat yangilash |
| Notifications | `/api/notifications` | O'qish, o'chirish, promo jo'natish |
| Analytics | `/api/analytics` | Admin va seller statistikasi |
| Search | `/api/search` | Global qidiruv |
| Chat | `/api/chat` | Xonalar, xabarlar (WebSocket ham) |
| Uploads | `/api/uploads` | Rasm yuklash |
| Health | `/api/health` | Server holati |

### Javob formati
Barcha muvaffaqiyatli javoblar:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": { ... }
}
```

Xato javobi:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Xato tavsifi"
}
```

---

## Rollar va ruxsatlar

| Amal | Buyer | Seller | Delivery | Admin |
|---|---|---|---|---|
| Mahsulotlarni ko'rish | ✅ | ✅ | ✅ | ✅ |
| Buyurtma berish | ✅ | — | — | ✅ |
| O'z buyurtmalarini ko'rish | ✅ | — | — | ✅ |
| Seller dashboard | — | ✅ | — | ✅ |
| Seller mahsulot CRUD | — | ✅ | — | ✅ |
| Kuryer paneli | — | — | ✅ | ✅ |
| Admin panel | — | — | — | ✅ |
| Foydalanuvchilarni boshqarish | — | — | — | ✅ |
| Kuponlarni boshqarish | — | — | — | ✅ |
| Sharhlarni tasdiqlash | — | — | — | ✅ |

> **Demo hisoblar:** Barcha rollar uchun demo versiyasi mavjud — lekin faqat ko'rish (GET) amallar ishlaydi.

---

## To'lov tizimi

Real Payme/Click/Uzum API kalitlari yo'qligi sababli **mock (soxta) to'lov tizimi** qurilgan:

### Qanday ishlaydi

1. Checkout sahifasida to'lov usulini tanlanadi (Payme, Click, Uzum)
2. Buyurtma yaratilganda `/payment/:orderId` sahifasiga yo'naltiriladi
3. "To'lash" tugmasi bosilganda backend **15 daqiqalik token** yaratadi
4. Frontend `/payment/simulate/:token` sahifasini ochadi — bu **bank interfeysi simulyatori**
5. Simulyator PIN kiritadi va:
   - **"To'lovni tasdiqlash"** → buyurtma `paymentStatus: paid` bo'ladi
   - **"Bekor qilish"** → `paymentStatus: cancelled` bo'ladi
6. Natijaga qarab buyurtma sahifasiga qaytariladi

### To'lov simulyatori interfeysi
- Har provider uchun o'z rang sxemasi (Payme — ko'k, Click — yashil, Uzum — binafsha)
- PIN klaviaturasi animatsiya bilan
- "Bank bilan aloqa" jarayon ekrani
- Muvaffaqiyat / bekor ekrani (spring animatsiya)
- 15 daqiqa muddati sanash

### Mock webhook endpointlar (real integratsiya uchun)
```
POST /api/payments/webhook/payme          # Payme JSON-RPC
POST /api/payments/webhook/click/prepare  # Click Prepare
POST /api/payments/webhook/click/complete # Click Complete
POST /api/payments/webhook/uzum           # Uzum HMAC-SHA256
```

---

## Modullar ro'yxati

### Backend (`backend/src/modules/`)
```
auth/           — Ro'yxatdan o'tish, tizimga kirish, token rotation
users/          — Profil, avatar, seller arizasi, sellerlar ro'yxati
categories/     — Daraxli kategoriyalar CRUD
products/       — Mahsulotlar, variantlar, rasmlar, ko'rishlar
cart/           — Savatcha, kupon qo'llash/olib tashlash
orders/         — Buyurtma berish, holat, bekor qilish, tarix
payments/       — Mock Payme/Click/Uzum, simulator, admin refund
reviews/        — Sharh yozish, seller reply, admin publish/unpublish
coupons/        — Kupon CRUD, foydalanish tekshiruvi
delivery/       — Kuryer topshiriqlari, holat yangilash
notifications/  — Bildirishnomalar, promo jo'natish
analytics/      — Admin va seller dashboardi statistikasi
search/         — Mahsulot va kategoriya qidiruvi
chat/           — WebSocket chat, xona boshqaruvi
recommendations/— Tavsiya etilgan mahsulotlar
uploads/        — Rasm yuklash (Multer + Sharp optimizatsiya)
health/         — GET /api/health (server holati)
mail/           — Email jo'natish servisi
otp/            — Telefon OTP xizmati
```

### Frontend (`frontend/src/`)
```
pages/
  ├── auth/           — Login, Register, Email verification
  ├── catalog/        — Katalog, filter, sort
  ├── products/       — Mahsulot sahifasi, sharhlar
  ├── cart/           — Savatcha
  ├── checkout/       — Buyurtma berish (3 bosqich)
  ├── payment/        — PaymentPage, PaymentSimulator
  ├── orders/         — Buyurtmalar ro'yxati, batafsil
  ├── profile/        — Profil, parol, seller bo'lish
  ├── wishlist/       — Sevimlilar
  ├── seller/         — Seller dashboard, mahsulotlar, buyurtmalar, analitika
  ├── admin/          — Admin panel (14 bo'lim)
  ├── delivery/       — Kuryer paneli
  ├── chat/           — Chat sahifasi
  ├── notifications/  — Bildirishnomalar
  └── static/         — About, Contact, Privacy, Terms

store/
  ├── api/
  │   ├── apiSlice.ts       — RTK Query base (reauth + unwrap)
  │   ├── productsApi.ts
  │   ├── cartApi.ts
  │   ├── ordersApi.ts
  │   ├── paymentsApi.ts
  │   ├── adminApi.ts
  │   ├── usersApi.ts
  │   ├── reviewsApi.ts
  │   ├── deliveryApi.ts
  │   └── searchApi.ts
  └── slices/
      └── authSlice.ts      — Auth holati, localStorage

components/
  ├── layout/         — Header, Footer, MainLayout
  └── guards/         — AuthGuard, GuestGuard, RoleGuard
```

---

## Papka strukturasi

```
online-shop_2/
│
├── README.md
│
├── backend/
│   ├── .env                          # Muhit o'zgaruvchilari (Neon DB)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts                   # Bootstrap (rawBody=true Uzum uchun)
│       ├── app.module.ts             # Global guards: Throttler, Jwt, Demo, Roles
│       ├── config/
│       │   ├── configuration.ts      # Barcha config
│       │   ├── typeorm.config.ts     # DATABASE_URL + SSL qo'llab-quvvatlash
│       │   └── env.validation.ts     # Joi schema
│       ├── common/
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts
│       │   │   ├── roles.guard.ts
│       │   │   └── demo.guard.ts     # Demo foydalanuvchi blokirovka
│       │   ├── decorators/
│       │   │   ├── current-user.decorator.ts
│       │   │   ├── public.decorator.ts
│       │   │   └── roles.decorator.ts
│       │   ├── filters/
│       │   ├── interceptors/
│       │   └── utils/
│       ├── database/
│       │   ├── data-source.ts        # DATABASE_URL + SSL
│       │   ├── entities/             # 26 ta entity
│       │   ├── migrations/
│       │   └── seeds/
│       │       └── seed.ts           # Production-grade seed
│       └── modules/                  # 16 ta modul
│
└── frontend/
    ├── index.html
    ├── vite.config.ts                # /api → localhost:3000 proxy
    ├── package.json
    └── src/
        ├── main.tsx
        ├── router.tsx                # Barcha route-lar
        ├── index.css                 # Tailwind
        ├── components/
        ├── pages/
        └── store/
```

---

## Tez-tez so'raladigan savollar

**Q: Seed ikkinchi marta ishlatilsa nima bo'ladi?**  
A: Xavfsiz — har bir yozuv `findOne` bilan tekshiriladi. Mavjud bo'lsa o'tkazib yuboriladi.

**Q: Real Payme/Click/Uzum qanday ulash?**  
A: `.env` ga mos kalitlarni qo'ying:  
```env
PAYME_KEY=haqiqiy_kalit
PAYME_MERCHANT_ID=haqiqiy_id
CLICK_SECRET=haqiqiy_secret
CLICK_MERCHANT_ID=haqiqiy_id
UZUM_SECRET=haqiqiy_secret
```
Webhook URL'larini provider admin panelida ro'yxatdan o'tkazing:
- Payme: `https://your-domain.com/api/payments/webhook/payme`
- Click Prepare: `https://your-domain.com/api/payments/webhook/click/prepare`
- Click Complete: `https://your-domain.com/api/payments/webhook/click/complete`
- Uzum: `https://your-domain.com/api/payments/webhook/uzum`

**Q: Demo hisoblar nima uchun kerak?**  
A: Portfolio ko'ruvchilar uchun — login qilib saytni ishlatib ko'rishlari mumkin, lekin real ma'lumotlarga zarar yetkazolmaydi.

**Q: Production deployment uchun nima kerak?**  
A: `DB_SYNCHRONIZE=false` qo'ying va `npm run migration:run` ishlating. `NODE_ENV=production`, barcha JWT secretlarini kuchli qiling.

**Q: Rasmlar qaerda saqlanadi?**  
A: `backend/uploads/` papkasida (local). Production uchun AWS S3 yoki Cloudinary integratsiyasi kerak.

---

## Litsenziya

MIT © 2026 Sarvarbek
