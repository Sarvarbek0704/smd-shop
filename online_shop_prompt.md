# 🛒 Online Shop — To'liq Loyiha Prompti

## Loyiha haqida umumiy ma'lumot

Sen tajribali full-stack dasturchi sifatida men bilan birga katta hajmli **O'zbekiston bozori uchun universal online do'kon** loyihasini qurishingni xohlayman. Bu loyiha production-ready, real foydalanuvchilar uchun ishlaydigan, kengaytirilishi mumkin bo'lgan tizim bo'lishi kerak.

Loyiha ikki asosiy qismdan iborat:
- **Backend**: NestJS (Node.js)
- **Frontend**: React (Vite), Next, Redux

---

## Texnologiyalar stacki

### Backend (NestJS)
- **Framework**: NestJS (latest stable)
- **Language**: TypeScript (strict mode)
- **ORM**: TypeORM
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Auth**: Custom AUTH(register, login with email and phone number) and Passport.js (JWT strategy, Google OAuth2, Telegram OAuth)
- **Real-time**: Socket.io (NestJS Gateway)
- **File storage**: MinIO (S3-compatible, local) yoki AWS S3
- **SMS**: Eskiz.uz API
- **Push notifications**: Firebase Cloud Messaging (FCM)
- **Validation**: class-validator + class-transformer
- **Docs**: Swagger (OpenAPI 3.0)
- **Testing**: Jest + Supertest
- **Task scheduler**: @nestjs/schedule (node-cron)
- **Queue**: BullMQ (Redis-based)

### Frontend (React)
- **Bundler**: Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **State management**: Zustand (global state) + React Query (server state)
- **UI library**: shadcn/ui + Radix UI (accessible primitives)
- **Styling**: Tailwind CSS v3
- **Forms**: React Hook Form + Zod
- **Real-time**: Socket.io-client
- **HTTP client**: Axios (interceptors bilan)
- **Charts**: Recharts (admin analytics uchun)
- **Image**: react-image-crop (upload uchun), next/image alternative

### DevOps / Infra
- **Containerization**: Docker + Docker Compose
- **Database migrations**: TypeORM migrations
- **Environment**: `.env` fayllari (dotenv)
- **Monorepo struktura**: `apps/backend` + `apps/frontend` (yoki alohida repolar)

---

## Loyiha strukturasi

```
online-shop/
├── backend/                        # NestJS ilovasi
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # JWT, Google, Telegram OAuth
│   │   │   ├── users/              # Foydalanuvchi profili
│   │   │   ├── roles/              # RBAC: Admin, Seller, Buyer, Delivery
│   │   │   ├── categories/         # Toifa daraxti (tree)
│   │   │   ├── products/           # Mahsulot CRUD, variantlar, rasmlar
│   │   │   ├── search/             # Full-text search, filter, Redis cache
│   │   │   ├── cart/               # Savat (Redis + DB)
│   │   │   ├── orders/             # Buyurtmalar va holat boshqaruvi
│   │   │   ├── delivery/           # Kuryer moduli
│   │   │   ├── payments/           # Payme, Click, Uzum Bank, COD
│   │   │   ├── chat/               # WebSocket real-time chat
│   │   │   ├── notifications/      # Push, SMS, in-app bildirishnomalar
│   │   │   ├── reviews/            # Sharhlar va reyting
│   │   │   ├── wishlist/           # Sevimlilar
│   │   │   ├── coupons/            # Kuponlar va chegirmalar
│   │   │   ├── recommendations/    # Mahsulot tavsiyalari
│   │   │   ├── admin/              # Admin boshqaruv paneli API
│   │   │   ├── uploads/            # Fayl yuklash (MinIO/S3)
│   │   │   └── analytics/          # Savdo statistikasi
│   │   ├── common/
│   │   │   ├── decorators/         # Custom decoratorlar
│   │   │   ├── guards/             # Auth, Roles guardlar
│   │   │   ├── filters/            # Exception filterlar
│   │   │   ├── interceptors/       # Response transformatsiya
│   │   │   ├── pipes/              # Validation piplar
│   │   │   └── utils/              # Yordamchi funksiyalar
│   │   ├── config/                 # Konfiguratsiya (typeorm, redis, jwt, ...)
│   │   ├── database/
│   │   │   ├── entities/           # TypeORM entitylar
│   │   │   └── migrations/         # DB migratsiyalar
│   │   └── main.ts
│   ├── test/                       # E2E testlar
│   ├── .env.example
│   └── package.json
│
└── frontend/                       # React ilovasi
    ├── src/
    │   ├── pages/
    │   │   ├── home/               # Bosh sahifa
    │   │   ├── catalog/            # Mahsulotlar ro'yxati, filter
    │   │   ├── product/            # Mahsulot sahifasi
    │   │   ├── cart/               # Savat
    │   │   ├── checkout/           # Buyurtma berish
    │   │   ├── orders/             # Buyurtmalar tarixi
    │   │   ├── chat/               # Real-time chat
    │   │   ├── wishlist/           # Sevimlilar
    │   │   ├── auth/               # Login, Register sahifalar
    │   │   ├── profile/            # Foydalanuvchi profili
    │   │   ├── seller/             # Seller dashboard
    │   │   ├── admin/              # Admin panel
    │   │   └── delivery/           # Kuryer interfeysi
    │   ├── components/
    │   │   ├── ui/                 # shadcn/ui komponentlar
    │   │   ├── layout/             # Header, Footer, Sidebar
    │   │   ├── product/            # ProductCard, ProductGrid, ...
    │   │   ├── cart/               # CartDrawer, CartItem, ...
    │   │   ├── auth/               # LoginForm, RegisterForm, ...
    │   │   └── shared/             # Umumiy komponentlar
    │   ├── hooks/                  # Custom React hooklar
    │   ├── store/                  # Zustand store
    │   ├── api/                    # Axios instancelar va API funksiyalar
    │   ├── types/                  # TypeScript tiplar
    │   └── utils/                  # Yordamchi funksiyalar
    └── package.json
```

---

## Ma'lumotlar bazasi sxemasi (PostgreSQL)

Quyidagi jadvallar va ularning munosabatlarini to'liq implement qil:

### Asosiy jadvallar

**users**
```
id (uuid, PK), email (unique, nullable), phone (unique, nullable),
first_name, last_name, avatar_url, is_verified (bool),
is_active (bool, default true), created_at, updated_at
```

**roles** — RBAC
```
id (uuid, PK), name (enum: admin | seller | buyer | delivery),
description
```

**user_roles** — ko'p-ko'p
```
user_id (FK), role_id (FK)
```

**oauth_providers**
```
id, user_id (FK), provider (enum: google | telegram),
provider_id (string), access_token, refresh_token, created_at
```

**categories**
```
id, name, slug (unique), description, image_url,
parent_id (self-reference, nullable), sort_order, is_active,
created_at, updated_at
```

**products**
```
id (uuid, PK), seller_id (FK→users), category_id (FK),
name, slug (unique), description (text), short_description,
base_price (decimal), discount_price (nullable decimal),
discount_ends_at (nullable timestamp),
status (enum: draft | active | banned | out_of_stock),
is_featured (bool), view_count (int, default 0),
rating_avg (decimal, default 0), rating_count (int, default 0),
created_at, updated_at
```

**product_variants**
```
id, product_id (FK), sku (unique), name (e.g. "L / Ko'k"),
price_modifier (decimal), stock_quantity (int),
attributes (jsonb: {color, size, weight, ...}), image_url,
is_active (bool), created_at
```

**product_images**
```
id, product_id (FK), url, alt_text, sort_order, is_primary (bool)
```

**carts**
```
id, user_id (FK, unique), created_at, updated_at
```

**cart_items**
```
id, cart_id (FK), product_id (FK), variant_id (FK nullable),
quantity (int), added_at
```

**orders**
```
id (uuid, PK), order_number (unique, auto-generated),
buyer_id (FK→users), seller_id (FK→users),
status (enum: pending | confirmed | processing | shipped | delivered | cancelled | refunded),
total_amount (decimal), discount_amount (decimal, default 0),
final_amount (decimal),
shipping_address (jsonb: {region, city, street, zip, ...}),
payment_method (enum: payme | click | uzum | cod),
payment_status (enum: pending | paid | failed | refunded),
payment_transaction_id (nullable),
notes (text, nullable), cancelled_reason (nullable),
created_at, updated_at
```

**order_items**
```
id, order_id (FK), product_id (FK), variant_id (FK nullable),
product_name (snapshot), product_image (snapshot),
quantity, unit_price, total_price
```

**order_status_history**
```
id, order_id (FK), from_status, to_status, changed_by (FK→users),
note, created_at
```

**deliveries**
```
id, order_id (FK, unique), courier_id (FK→users nullable),
status (enum: waiting | assigned | picked_up | on_the_way | delivered | failed),
pickup_address (jsonb), delivery_address (jsonb),
estimated_at, delivered_at, notes, created_at, updated_at
```

**payments** — to'lov tranzaksiyalari
```
id (uuid), order_id (FK), provider (enum: payme | click | uzum | cod),
provider_transaction_id (nullable), amount (decimal),
status (enum: pending | success | failed | cancelled | refunded),
payload (jsonb — provider raw response), created_at, updated_at
```

**reviews**
```
id, product_id (FK), user_id (FK), order_id (FK — verified purchase),
rating (int, 1–5), title, body (text), images (jsonb array),
is_verified_purchase (bool), seller_reply (text nullable),
is_published (bool, default true), created_at, updated_at
```

**wishlists**
```
id, user_id (FK), product_id (FK), created_at
UNIQUE(user_id, product_id)
```

**coupons**
```
id (uuid), code (unique, uppercase), description,
type (enum: percentage | fixed_amount),
value (decimal), min_order_amount (decimal nullable),
max_discount_amount (decimal nullable — percentage uchun cap),
usage_limit (int nullable), used_count (int, default 0),
user_id (FK nullable — specific user uchun),
starts_at, expires_at, is_active (bool), created_at
```

**coupon_usages**
```
id, coupon_id (FK), user_id (FK), order_id (FK), used_at
```

**chat_rooms**
```
id, product_id (FK), buyer_id (FK), seller_id (FK),
last_message_at, created_at
UNIQUE(product_id, buyer_id, seller_id)
```

**chat_messages**
```
id, room_id (FK), sender_id (FK→users),
content (text), message_type (enum: text | image | system),
is_read (bool, default false), read_at (nullable), created_at
```

**notifications**
```
id, user_id (FK), type (enum: order_update | new_message | review | promo | system),
title, body, data (jsonb nullable), is_read (bool, default false),
read_at (nullable), created_at
```

**product_views** — recommendation uchun
```
id, user_id (FK nullable), product_id (FK), session_id, viewed_at
```

---

## Barcha modullar — batafsil talablar

### 1. AUTH MODULI

**Endpoint'lar:**
```
POST /auth/register        — email/phone + password ro'yxatdan o'tish
POST /auth/login           — email/phone + password kirish
POST /auth/refresh         — access token yangilash
POST /auth/logout          — refresh token bekor qilish
GET  /auth/google          — Google OAuth redirect
GET  /auth/google/callback — Google OAuth callback
GET  /auth/telegram/callback — Telegram OAuth callback
POST /auth/forgot-password  — parol tiklash so'rovi (email/SMS)
POST /auth/reset-password   — yangi parol o'rnatish (token bilan)
POST /auth/verify-email     — email tasdiqlash
POST /auth/verify-phone     — telefon nomer tasdiqlash

```

**JWT strategiyasi:**
- Access token: 1 kun
- Refresh token: 30 kun, HttpOnly cookie yoki DB ga saqlanadi
- Refresh token rotation — har yangilashda eski token bekor qilinadi
- Blacklist (Redis) — logout qilingan tokenlar

**Google OAuth:**
- Passport GoogleStrategy
- Callback'da: foydalanuvchi mavjudligini tekshir, yo'q bo'lsa yaratish
- Mavjud bo'lsa, oauth_providers jadvaliga bog'lash

**Telegram OAuth:**
- Telegram Login Widget orqali hash tekshiruvi
- `sha256(token + ':' + sorted_params)` tekshiruvi

**Guards:**
```typescript
@UseGuards(JwtAuthGuard)           // Token kerak
@UseGuards(RolesGuard)             // Rol kerak
@Roles(Role.ADMIN, Role.SELLER)    // Decorator
```

---

### 2. USERS MODULI

**Endpoint'lar:**
```
GET    /users/me              — o'z profilini olish
PATCH  /users/me              — profilni yangilash
POST   /users/me/avatar       — avatar yuklash
DELETE /users/me              — akkauntni o'chirish (soft delete)
GET    /users/:id             — public profil (Seller profili)

// Admin endpoints
GET    /admin/users           — barcha foydalanuvchilar (pagination, filter)
GET    /admin/users/:id       — bitta foydalanuvchi
PATCH  /admin/users/:id       — profil yangilash
POST   /admin/users/:id/ban   — bloklash
POST   /admin/users/:id/unban — blokdan chiqarish
POST   /admin/users/:id/roles — rol qo'shish/o'chirish
```

---

### 3. CATEGORIES MODULI

**Xususiyatlar:**
- Cheksiz darajali daraxt strukturasi (parent_id self-reference)
- Slug auto-generation (slugify library)
- Rasm yuklash (MinIO)
- Soft delete (bolalar bilan)

**Endpoint'lar:**
```
GET  /categories              — daraxt ko'rinishida barcha toifalar
GET  /categories/:slug        — bitta toifa + bolalar
GET  /categories/:slug/products — toifadagi mahsulotlar

// Admin
POST   /admin/categories
PATCH  /admin/categories/:id
DELETE /admin/categories/:id
POST   /admin/categories/:id/reorder — tartibni o'zgartirish
```

---

### 4. PRODUCTS MODULI

**Xususiyatlar:**
- To'liq CRUD Seller uchun (faqat o'z mahsulotlari)
- Admin barcha mahsulotlarni boshqaradi
- Bir nechta rasm (asosiy + qo'shimcha)
- Variantlar (o'lcham, rang va boshqa atributlar)
- Holat: draft → (seller aktiv qiladi) → active ↔ (admin) banned
- View count (Redis orqali, har 5 daqiqada DB ga flush)
- Slug auto-generation + unique tekshiruv
- Vaqtli chegirma (discount_price + discount_ends_at)

**Endpoint'lar:**
```
// Public
GET  /products                — ro'yxat (pagination, filter, sort, search)
GET  /products/:slug          — bitta mahsulot (variant'lar bilan)
GET  /products/:slug/reviews  — mahsulot sharhlari
GET  /products/:slug/related  — o'xshash mahsulotlar

// Seller (authenticated + seller rol)
POST   /seller/products                     — yaratish
GET    /seller/products                     — o'z mahsulotlari
PATCH  /seller/products/:id                 — yangilash
DELETE /seller/products/:id                 — o'chirish
POST   /seller/products/:id/images          — rasm yuklash
DELETE /seller/products/:id/images/:imgId   — rasm o'chirish
POST   /seller/products/:id/publish         — draft → active
POST   /seller/products/:id/unpublish       — active → draft

POST   /seller/products/:id/variants        — variant qo'shish
PATCH  /seller/products/:id/variants/:vId   — variant yangilash
DELETE /seller/products/:id/variants/:vId   — variant o'chirish

// Admin
GET    /admin/products                  — barcha mahsulotlar
PATCH  /admin/products/:id/status       — holat o'zgartirish
POST   /admin/products/:id/feature      — featured qilish
```

**Filtering (GET /products query params):**
```
?category=slug
?min_price=10000&max_price=500000
?rating=4                    (4 va undan yuqori)
?seller=seller-id
?search=qidiruv so'zi
?sort=price_asc | price_desc | rating | newest | popular
?page=1&limit=24
?in_stock=true
?has_discount=true
```

---

### 5. SEARCH MODULI

**Xususiyatlar:**
- PostgreSQL Full-Text Search (tsvector/tsquery) — O'zbek va Rus tilida
- Redis cache: bir xil so'rov uchun 5 daqiqa TTL
- Cache key: `search:{hash(queryParams)}`
- Autocomplete endpoint (Redis Sorted Set ishlatish mumkin)
- Search history (foydalanuvchi uchun, Redis list)

**Endpoint'lar:**
```
GET  /search?q=noutbuk&category=elektronika&...
GET  /search/autocomplete?q=nout      — tez taklif (Redis)
GET  /search/popular                  — mashhur so'rovlar
```

---

### 6. CART MODULI

**Xususiyatlar:**
- Autentifikatsiya qilingan foydalanuvchilar uchun: DB da saqlanadi
- Session-based (cookie) savat: Redis da, login bo'lganda merge qilinadi
- Real-time savat miqdori update (WebSocket yoki optimistic UI)
- Mahsulot qo'shilganda stock tekshiruvi
- Savat item'i uchun max quantity = stock_quantity

**Endpoint'lar:**
```
GET    /cart                          — savatni olish (items, totals)
POST   /cart/items                    — mahsulot qo'shish
PATCH  /cart/items/:id                — miqdor o'zgartirish
DELETE /cart/items/:id                — o'chirish
DELETE /cart                          — savatni tozalash
POST   /cart/apply-coupon             — kupon qo'llash
DELETE /cart/remove-coupon            — kuponni olib tashlash
GET    /cart/summary                  — jami (qo'shib: chegirmalar, yetkazib berish)
```

**Cart DTO javobi:**
```typescript
{
  items: [{
    id, product: { id, name, slug, image }, variant: {...} | null,
    quantity, unit_price, total_price, stock_available
  }],
  subtotal, discount_amount, coupon_code: string | null,
  shipping_estimate: number,
  total, item_count
}
```

---

### 7. ORDERS MODULI

**Xususiyatlar:**
- Checkout jarayonida: savat → buyurtma yaratish
- Bir buyurtmada faqat bitta seller mahsulotlari (yoki ko'pga bo'lish — tanlov qil, lekin dokumentlash)
- Order number: `ORD-20240115-XXXXX` (timestamp + random)
- Status machine:
  ```
  pending → confirmed → processing → shipped → delivered
         ↘ cancelled (har qanday bosqichda, sababli)
  delivered → refunded (so'rov bilan)
  ```
- Status o'zgarganda: SMS + push + in-app notification
- Status history log (kimdir, qachon, nima o'zgardi)

**Endpoint'lar:**
```
// Buyer
POST   /orders                     — buyurtma yaratish (checkout)
GET    /orders                     — o'z buyurtmalari (pagination)
GET    /orders/:id                 — buyurtma tafsilotlari
POST   /orders/:id/cancel          — bekor qilish (faqat pending/confirmed)
GET    /orders/:id/payment         — to'lov havolasi

// Seller
GET    /seller/orders              — seller ga kelgan buyurtmalar
PATCH  /seller/orders/:id/status   — status yangilash (confirm/process/ship)

// Delivery (Courier)
GET    /delivery/orders            — tayinlangan buyurtmalar
PATCH  /delivery/orders/:id/status — picked_up / delivered / failed

// Admin
GET    /admin/orders               — barcha buyurtmalar
PATCH  /admin/orders/:id/status    — istalgan status
POST   /admin/orders/:id/refund    — qaytarish
```

---

### 8. PAYMENTS MODULI

**Xususiyatlar:**
- Har bir provider alohida service class
- Webhook URL-lar: `/payments/webhook/payme`, `/payments/webhook/click`, `/payments/webhook/uzum`
- Webhook'lar: signature tekshiruvi (har bir provayderning o'z algoritmi)
- Idempotency: bir tranzaksiyani ikki marta qayta ishlamaslik (Redis lock)
- COD: buyurtma yaratilganda payment pending, yetkazib berilganda completed

**Payme integration:**
```typescript
// Metod'lar:
CheckPerformTransaction  — to'lovni tekshirish
CreateTransaction        — tranzaksiya yaratish
PerformTransaction       — to'lovni amalga oshirish
CancelTransaction        — bekor qilish
CheckTransaction         — holat tekshirish
GetStatement             — hisobot
```

**Click integration:**
```typescript
// Ikki bosqich:
Prepare   — buyurtmani tekshirish
Complete  — to'lovni yakunlash
```

**Uzum Bank integration:**
```typescript
// Uzum Merchant API
create_order  — buyurtma yaratish
check_status  — holat tekshirish
webhook       — bildirishnoma qabul qilish
```

**Endpoint'lar:**
```
POST /payments/payme/webhook
POST /payments/click/webhook
POST /payments/uzum/webhook
GET  /payments/status/:orderId   — to'lov holati
POST /payments/retry/:orderId    — qayta to'lash havolasi
```

---

### 9. CHAT MODULI (WebSocket)

**Xususiyatlar:**
- NestJS WebSocket Gateway (Socket.io)
- Xona asoslangan: har bir product+buyer+seller uchun bir xona
- Redis Adapter: `@socket.io/redis-adapter` — ko'p server uchun
- Xabarlar DB ga saqlanadi
- O'qildi belgilash (is_read)
- Typing indicator (real-time, DB ga saqlanmaydi)
- Rasm yuklash (MinIO) chat ichida

**Socket events:**
```typescript
// Client → Server
'join_room'         { productId, sellerId }
'leave_room'        { roomId }
'send_message'      { roomId, content, type }
'mark_read'         { roomId, messageId }
'typing_start'      { roomId }
'typing_stop'       { roomId }

// Server → Client
'room_joined'       { room, messages: last 50 }
'new_message'       { message }
'message_read'      { messageId, readAt }
'user_typing'       { userId, roomId }
'user_online'       { userId }
'user_offline'      { userId }
```

**HTTP Endpoint'lar:**
```
GET  /chat/rooms                  — o'z xonalari
GET  /chat/rooms/:id              — xona tafsilotlari
GET  /chat/rooms/:id/messages     — xabarlar tarixi (pagination)
POST /chat/rooms/:id/images       — rasm yuklash
```

---

### 10. NOTIFICATIONS MODULI

**Xususiyatlar:**
- 3 kanal: In-app (DB), SMS (Eskiz.uz), Push (FCM)
- Queue asosida (BullMQ) — yuborish async
- Retry logic: 3 marta urinish, har bir urinish orasida 5 daqiqa
- Template tizimi (NestJS handlebars yoki oddiy string template)

**SMS template'lar (O'zbekcha):**
```
order_confirmed:  "Buyurtmangiz #{orderNumber} tasdiqlandi. Jami: {amount} so'm"
order_shipped:    "Buyurtmangiz #{orderNumber} jo'natildi. Yetkazib berish vaqti: {eta}"
order_delivered:  "Buyurtmangiz #{orderNumber} yetkazildi. Sharh qoldiring!"
payment_success:  "To'lov muvaffaqiyatli qabul qilindi. #{orderNumber}, {amount} so'm"
```

**Endpoint'lar:**
```
GET    /notifications             — foydalanuvchi xabarnomalari
PATCH  /notifications/:id/read   — o'qildi
PATCH  /notifications/read-all   — hammasini o'qildi
DELETE /notifications/:id

POST   /users/me/fcm-token       — FCM token saqlash
DELETE /users/me/fcm-token       — FCM token o'chirish
```

---

### 11. REVIEWS MODULI

**Xususiyatlar:**
- Faqat yetkazib berilgan buyurtmalar uchun sharh qoldirish mumkin
- Bir foydalanuvchi bir mahsulot uchun bir marta sharh
- Seller javob bera oladi
- Rasm yuklash (max 5 ta)
- Sharhdan so'ng: product.rating_avg va rating_count yangilanadi (trigger yoki service)
- Moderatsiya: admin soxta sharhlarni o'chira oladi

**Endpoint'lar:**
```
// Public
GET  /products/:slug/reviews          — sharhlar (filter: rating, sort: newest/helpful)

// Authenticated
POST   /reviews                       — sharh yaratish
PATCH  /reviews/:id                   — o'z sharhini tahrirlash
DELETE /reviews/:id                   — o'z sharhini o'chirish
POST   /reviews/:id/seller-reply      — seller javobi

// Admin
GET    /admin/reviews                 — barcha sharhlar
PATCH  /admin/reviews/:id/unpublish   — berkitish
```

---

### 12. WISHLIST MODULI

**Endpoint'lar:**
```
GET    /wishlist                  — sevimlilar ro'yxati
POST   /wishlist/:productId       — qo'shish
DELETE /wishlist/:productId       — o'chirish
GET    /wishlist/check/:productId — mavjudligini tekshirish
```

---

### 13. COUPONS MODULI

**Xususiyatlar:**
- Kupon turlari: `percentage` (foiz) va `fixed_amount` (sobit summa)
- Minimum buyurtma summasiga limit
- Foiz uchun maksimal chegirma
- Foydalanish limiti (umumiy va foydalanuvchi boshiga)
- Vaqt oralig'i (starts_at, expires_at)
- Specific foydalanuvchi uchun yoki hamma uchun
- Kupon kodi (case-insensitive)

**Endpoint'lar:**
```
// Buyer
POST /cart/apply-coupon { code }
GET  /coupons/validate/:code       — kupon haqiqiyligini tekshirish

// Admin
GET    /admin/coupons
POST   /admin/coupons
PATCH  /admin/coupons/:id
DELETE /admin/coupons/:id
GET    /admin/coupons/:id/usages   — kimlar ishlatgani
```

---

### 14. RECOMMENDATIONS MODULI

**Xususiyatlar:**
- Content-based filtering: kategoriya, narx oralig'i, teglar bo'yicha
- Collaborative filtering (boshlang'ich): "bu mahsulotni ko'rganlar shularni ham ko'rdi"
- "Oxirgi ko'rilgan mahsulotlar" — Redis List (max 20 ta, user boshiga)
- "Trend mahsulotlar" — Redis Sorted Set (haftalik view count)
- Real-time kanalga product view'ni log qilish

**Endpoint'lar:**
```
GET /recommendations/for-you         — shaxsiy tavsiyalar (auth kerak)
GET /recommendations/trending        — trend mahsulotlar
GET /recommendations/similar/:productId — o'xshash mahsulotlar
GET /recommendations/recently-viewed — oxirgi ko'rilganlar (auth kerak)
```

---

### 15. ANALYTICS MODULI (Admin)

**Xususiyatlar:**
- Kunlik/haftalik/oylik savdo statistikasi
- Eng ko'p sotilgan mahsulotlar TOP 10
- Eng faol seller'lar TOP 10
- Geografiya bo'yicha buyurtmalar (viloyat)
- To'lov usuli bo'yicha taqsimot
- Yangi foydalanuvchilar soni (kun bo'yicha)

**Endpoint'lar:**
```
GET /admin/analytics/overview            — umumiy dashboard
GET /admin/analytics/sales?period=week   — savdo grafigi
GET /admin/analytics/products/top        — top mahsulotlar
GET /admin/analytics/sellers/top         — top seller'lar
GET /admin/analytics/payments/breakdown  — to'lov taqsimoti
GET /admin/analytics/users/growth        — foydalanuvchi o'sishi
```

---

### 16. UPLOADS MODULI

**Xususiyatlar:**
- MinIO (S3-compatible) storage
- Rasm optimallashtirish: sharp library (resize, webp konversiya)
- Fayl turi va hajm tekshiruvi:
  - Rasm: max 5MB, jpg/png/webp
  - Hujjat: max 10MB, pdf
- Bucket-lar: `products`, `avatars`, `chat`, `reviews`
- URL: CDN yoki MinIO public URL
- Fayl nomi: `{bucket}/{userId}/{timestamp}-{random}.webp`

**Endpoint'lar:**
```
POST /uploads/image         — rasm yuklash (multipart/form-data)
POST /uploads/images        — ko'p rasm (max 10)
DELETE /uploads/:key        — o'chirish
```

---

## Frontend sahifalari — batafsil talablar

### Bosh sahifa (`/`)
- Hero banner (carousel — admin boshqaradi)
- Kategoriyalar grid
- Trend mahsulotlar carousel (recommendation API)
- Flash sale bo'limi (vaqtli chegirmalar, countdown timer)
- Yangi mahsulotlar
- Tavsiya etilgan mahsulotlar (agar login bo'lsa — personalized)
- Footer: kategoriyalar, havolalar, ijtimoiy tarmoqlar

### Katalog sahifasi (`/catalog`, `/catalog/:categorySlug`)
- Sidebar: filter panel
  - Kategoriya daraxti
  - Narx range slider (min–max)
  - Reyting filtri (checkbox)
  - Holat filtri (chegirma bor/yo'q, stokda)
- Mahsulotlar grid (2/3/4 kolonna — responsive)
- Sort dropdown (narx, reyting, yangilik, mashhurlik)
- Pagination yoki Infinite scroll
- "Natija topilmadi" holatini chiroyli ko'rsatish
- Filter tanlovlar badge sifatida (olib tashlash imkoni)
- Filter o'zgarishi URL query params ga saqlansin (shareable URL)

### Mahsulot sahifasi (`/products/:slug`)
- Rasm gallery (asosiy + thumbnails, zoom on hover)
- Variant tanlash (rang/o'lcham — rang uchun circles, o'lcham uchun buttons)
- Narx (eski + yangi narx + chegirma % badge)
- Stock holati (stokda/stok tugaydi/stok yo'q)
- "Savatga qo'sh" + "Bir zumda sotib ol" buttons
- Wishlist toggle (❤️)
- Miqdor selector (+/-)
- Seller ma'lumoti (rasm, ism, reyting, "Seller do'koni" havolasi)
- "Seller bilan bog'lanish" — chat ocha
- Mahsulot tavsifi (rich text render)
- Reyting summary (5 yulduz breakdown grafigi)
- Sharhlar ro'yxati (pagination)
- O'xshash mahsulotlar carousel
- Oxirgi ko'rilganlar

### Savat (`/cart`)
- Cart items (rasm, nom, variant, narx, miqdor stepper)
- O'chirish (confirm modal)
- Kupon input + "Qo'llash" button
- Buyurtma jamlanmasi (sidebar/bottom):
  - Mahsulotlar soni va narxi
  - Chegirma
  - Yetkazib berish
  - Jami
- "Buyurtma berish" button

### Checkout (`/checkout`)
- Multi-step form:
  1. **Yetkazib berish manzili**: viloyat, shahar, ko'cha, uy, index, ism, telefon
  2. **To'lov usuli**: Payme | Click | Uzum Bank | Naqd pul radio buttons
  3. **Buyurtmani tasdiqlash**: xulosa ko'rinish
- Progress indicator (step 1/2/3)
- Manzil saqlab qolish (keyingi safar uchun)
- To'lov tanlanganda tegishli widget/iframe ochiladi

### Buyurtmalar (`/orders`, `/orders/:id`)
- Buyurtmalar tarixi: status badge, sana, mahsulot rasmlari, jami summa
- Filter: barcha | faol | yakunlangan | bekor qilingan
- Buyurtma tafsilotlari:
  - Holat timeline (qaysi bosqichda)
  - Mahsulotlar ro'yxati
  - To'lov ma'lumoti
  - Yetkazib berish manzili
  - Bekor qilish button (agar imkon bo'lsa)
  - "Sharh yozish" button (yetkazib berilgandan keyin)

### Chat (`/chat`, `/chat/:roomId`)
- Xonalar ro'yxati (chap sidebar) — oxirgi xabar, o'qilmagan badge
- Chat interfeysi (WhatsApp/Telegram style):
  - Xabar pufakchalari (sent/received farq)
  - Vaqt belgilari
  - O'qildi belgilash (✓✓)
  - Typing indicator ("... yozmoqda")
  - Rasm yuborish
- Mobile da: xonalar → chat (back button)

### Profil (`/profile`)
- Ma'lumotlarni tahrirlash
- Avatar yuklash (crop + upload)
- Parolni o'zgartirish
- OAuth bog'langan akkauntlar (Google, Telegram)
- Bildirishnoma sozlamalari (SMS on/off, Push on/off)
- FCM token ro'yxatdan o'tkazish

### Seller Dashboard (`/seller/*`)
```
/seller              — umumiy ko'rinish (savdo, buyurtmalar)
/seller/products     — mahsulotlar ro'yxati (status filter)
/seller/products/new — yangi mahsulot (ko'p bosqichli forma)
/seller/products/:id — mahsulotni tahrirlash
/seller/orders       — buyurtmalar (filter: yangi, jarayonda, yakunlangan)
/seller/orders/:id   — buyurtma tafsilotlari + status yangilash
/seller/reviews      — sharhlar + javob berish
/seller/analytics    — savdo grafiklari, top mahsulotlar
/seller/chat         — xabarlar
```

**Yangi mahsulot formasi (ko'p bosqichli):**
1. Asosiy ma'lumotlar (nom, kategoriya, tavsif)
2. Narx va stok (variantlar)
3. Rasmlar (drag & drop, tartibni o'zgartirish)
4. Ko'rib chiqish va chop etish

### Admin Panel (`/admin/*`)
```
/admin               — dashboard (statistika, kartochkalar)
/admin/users         — foydalanuvchilar (ban, rol)
/admin/sellers       — seller so'rovlari, tasdiqlash
/admin/products      — moderatsiya (aktiv/ban)
/admin/categories    — kategoriya daraxti (drag & drop tartiblash)
/admin/orders        — barcha buyurtmalar
/admin/payments      — to'lovlar, refund
/admin/coupons       — kupon yaratish va boshqarish
/admin/banners       — bosh sahifa banner'lar
/admin/reviews       — sharh moderatsiyasi
/admin/notifications — push xabarnoma yuborish
/admin/analytics     — to'liq statistika
```

### Delivery Interfeysi (`/delivery/*`)
```
/delivery            — tayinlangan buyurtmalar (xarita va ro'yxat)
/delivery/history    — yakunlangan buyurtmalar
/delivery/:orderId   — buyurtma ma'lumoti + holat yangilash
```

---

## Muhim texnik talablar

### Redis Cache strategiyasi
```
products:list:{hash}        TTL: 5 min   — mahsulotlar ro'yxati
products:single:{slug}      TTL: 10 min  — bitta mahsulot
categories:tree             TTL: 30 min  — kategoriyalar daraxti
search:{hash}               TTL: 5 min   — qidiruv natijalari
trending:products           TTL: 1 hour  — trend mahsulotlar
cart:{userId}               TTL: 7 days  — savat (guest uchun)
user:recent:{userId}        TTL: 30 days — oxirgi ko'rilgan mahsulotlar

Cache invalidation:
- Mahsulot o'zgarganda: products:single:{slug}, products:list:*
- Yangi mahsulot qo'shilganda: categories:*, products:list:*
```

### Error handling
Global Exception Filter barcha xatolarni standart formatga keltirsin:
```typescript
{
  statusCode: number,
  message: string | string[],
  error: string,
  timestamp: string,
  path: string
}
```

### Pagination standarti
Barcha ro'yxat endpoint'larda bir xil format:
```typescript
{
  data: T[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}
```

### API javob standarti
```typescript
// Muvaffaqiyat
{ success: true, data: T, message?: string }

// Xato
{ success: false, message: string, errors?: Record<string, string[]> }
```

### Security talablari
- Helmet.js (HTTP headers)
- CORS (faqat frontend domain)
- Rate limiting: 
  - `/auth/login`: 5 urinish / daqiqa (IP bo'yicha)
  - `/auth/register`: 3 urinish / soat (IP bo'yicha)
  - Umumiy: 100 so'rov / daqiqa (user bo'yicha)
- SQL injection himoya: TypeORM parameterized queries
- XSS: input sanitization (DOMPurify yoki sanitize-html)
- File upload: MIME type tekshiruvi (extension emas, buffer)

### Swagger dokumentatsiya
- Barcha endpoint'lar documented bo'lsin
- Request/Response DTO'lar schema ko'rinishida
- Auth uchun Bearer token input
- Tag'lar bo'yicha guruhlash (auth, products, orders, ...)

---

## Kodni yozishda qoidalar

1. **NestJS**: Har bir modul o'z papkasida (module, controller, service, dto, entity). God object yo'q.
2. **DTOs**: `class-validator` bilan to'liq validatsiya. `@ApiProperty()` Swagger uchun.
3. **Entities**: TypeORM decorator'lar bilan. `@CreateDateColumn`, `@UpdateDateColumn`.
4. **Services**: Biznes logika faqat service'da. Controller faqat HTTP qatlamida.
5. **Guards**: `JwtAuthGuard` + `RolesGuard` — barcha himoyalangan route'larda.
6. **Transactions**: Bir nechta DB operatsiyasi bo'lganda `QueryRunner` ishlatish.
7. **React**: Functional komponentlar faqat. Props uchun TypeScript interface.
8. **Custom hooks**: API call'lar React Query orqali, `useQuery`/`useMutation`.
9. **Zustand store'lar**: Auth, Cart, UI (modal, sidebar holatlari).
10. **Axios interceptors**: 401 → token refresh → retry; error → toast notification.

---

## Muhit o'zgaruvchilari (.env)

```env
# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=shop_user
DB_PASSWORD=shop_password
DB_DATABASE=online_shop

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_ACCESS_SECRET=your_access_secret_32chars_min
JWT_REFRESH_SECRET=your_refresh_secret_32chars_min
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Telegram OAuth
TELEGRAM_BOT_TOKEN=

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_PRODUCTS=products
MINIO_BUCKET_AVATARS=avatars

# Eskiz SMS
ESKIZ_EMAIL=
ESKIZ_PASSWORD=
ESKIZ_FROM=4546

# FCM
FCM_PROJECT_ID=
FCM_PRIVATE_KEY=
FCM_CLIENT_EMAIL=

# Payme
PAYME_MERCHANT_ID=
PAYME_SECRET_KEY=
PAYME_TEST_SECRET_KEY=

# Click
CLICK_MERCHANT_ID=
CLICK_SERVICE_ID=
CLICK_SECRET_KEY=

# Uzum Bank
UZUM_MERCHANT_ID=
UZUM_SECRET_KEY=
```

---

## Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: shop_user
      POSTGRES_PASSWORD: shop_password
      POSTGRES_DB: online_shop
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]
    volumes: [minio_data:/data]

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

---

## Boshlash tartibi

Quyidagi ketmada implement qil:

1. **Docker Compose** → barcha servislarni ishga tushur
2. **NestJS asosi** → project yaratish, konfiguratsiya, database ulanish
3. **TypeORM entities** → barcha jadvallarni yaratish, migratsiya
4. **Auth moduli** → JWT + Google + Telegram, Guards
5. **Users moduli** → CRUD, RBAC
6. **Uploads moduli** → MinIO integratsiya
7. **Categories moduli** → daraxt strukturasi
8. **Products moduli** → to'liq CRUD, variantlar, rasmlar
9. **Search** → FTS + Redis cache
10. **Cart moduli** → Redis + DB
11. **Orders moduli** → checkout, status machine
12. **Payments** → Payme, Click, Uzum, COD
13. **Chat** → WebSocket Gateway, Redis Adapter
14. **Notifications** → BullMQ, SMS, Push
15. **Reviews, Wishlist, Coupons** → qo'shimcha funksiyalar
16. **Recommendations** → Redis Sorted Set, collaborative filtering
17. **Analytics** → admin statistika
18. **React frontend** → barcha sahifalar
19. **Testing** → unit + E2E
20. **Swagger** → to'liq dokumentatsiya

---

## Muhim eslatma

Har bir modulni yozishda:
- To'liq ishlaydi deb hisoblama — edge case'larni ham yoz
- Xato xabarlarini foydalanuvchiga qulay qilib yoz (O'zbekcha bo'lsa ham bo'ladi)
- Console.log emas — NestJS `Logger` class ishlatish
- Har bir DB so'rovida kerakli ma'lumotni olish (n+1 muammodan qoching, `leftJoinAndSelect` yoki `relations` to'g'ri ishlatish)
- Sensitive ma'lumotlar (password, token) hech qachon response'da qaytmasin
- Pagination barcha ro'yxat so'rovlarida majburiy

Tayyor bo'lgan har bir modul uchun qisqacha sinov yo'riqnomasi bilan birga taqdim et.
