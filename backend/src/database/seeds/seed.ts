/**
 * Karvon — Production-grade seed
 *
 * Nimalar yaratiladi:
 *  - Rollar (admin, seller, buyer, delivery)
 *  - Kategoriyalar (4 parent, 13 child)
 *  - 1 real admin
 *  - 3 real seller (har birida do'kon)
 *  - 5 real buyer
 *  - 1 kuryer
 *  - DEMO: admin, seller, buyer (isDemo=true — faqat ko'rish rejimi)
 *  - 32 ta mahsulot (variantlar bilan)
 *  - 14 buyurtma (turli statuslar)
 *  - Delivery yozuvlari
 *  - 22 sharh
 *  - 5 kupon
 *  - 10 bildirishnoma
 */

import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { Review } from '../entities/review.entity';
import { Coupon } from '../entities/coupon.entity';
import { Delivery } from '../entities/delivery.entity';
import { Notification } from '../entities/notification.entity';
import {
  RoleName,
  ProductStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CouponType,
  DeliveryStatus,
  NotificationType,
  SellerStatus,
} from '../entities/enums';

const HASH_ROUNDS = 10;
const DEMO_PASS = 'Demo12345!';
const REAL_PASS = 'Shop12345!';

// ──────────────────────────────────────────────────────────────────────────────

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱  Seed boshlandi...\n');

  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const catRepo = AppDataSource.getTreeRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const variantRepo = AppDataSource.getRepository(ProductVariant);
  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);
  const historyRepo = AppDataSource.getRepository(OrderStatusHistory);
  const reviewRepo = AppDataSource.getRepository(Review);
  const couponRepo = AppDataSource.getRepository(Coupon);
  const deliveryRepo = AppDataSource.getRepository(Delivery);
  const notifRepo = AppDataSource.getRepository(Notification);

  // ── 1. ROLLAR ──────────────────────────────────────────────────────────────
  console.log('📌  Rollar yaratilmoqda...');
  const roleMap: Record<string, Role> = {};
  for (const name of Object.values(RoleName)) {
    let r = await roleRepo.findOne({ where: { name } });
    if (!r) {
      r = await roleRepo.save(
        roleRepo.create({ name, description: `${name} roli` }),
      );
      console.log(`   ✓ Rol: ${name}`);
    }
    roleMap[name] = r;
  }

  // ── 2. KATEGORIYALAR ───────────────────────────────────────────────────────
  console.log('\n📁  Kategoriyalar yaratilmoqda...');

  const catTree = [
    {
      name: 'Elektronika',
      slug: 'elektronika',
      icon: '📱',
      children: [
        { name: 'Smartfonlar', slug: 'smartfonlar' },
        { name: 'Noutbuklar', slug: 'noutbuklar' },
        { name: 'Audio & Video', slug: 'audio-video' },
        { name: 'Aksessuarlar', slug: 'aksessuarlar' },
      ],
    },
    {
      name: 'Kiyim & Moda',
      slug: 'kiyim-moda',
      icon: '👔',
      children: [
        { name: 'Erkaklar kiyimi', slug: 'erkaklar-kiyimi' },
        { name: 'Ayollar kiyimi', slug: 'ayollar-kiyimi' },
        { name: 'Bolalar kiyimi', slug: 'bolalar-kiyimi' },
        { name: 'Sport kiyimlari', slug: 'sport-kiyimlari' },
      ],
    },
    {
      name: "Uy & Bog'",
      slug: 'uy-bog',
      icon: '🏠',
      children: [
        { name: 'Mebel', slug: 'mebel' },
        { name: 'Oshxona buyumlari', slug: 'oshxona-buyumlari' },
        { name: 'Bezatish', slug: 'bezatish' },
      ],
    },
    {
      name: 'Sport & Fitnes',
      slug: 'sport-fitnes',
      icon: '⚽',
      children: [
        { name: 'Fitnes uskunalari', slug: 'fitnes-uskunalari' },
        { name: 'Velosipedlar', slug: 'velosipedlar' },
      ],
    },
  ];

  const catBySlug: Record<string, Category> = {};
  for (const c of catTree) {
    let parent = await catRepo.findOne({ where: { slug: c.slug } });
    if (!parent) {
      parent = await catRepo.save(
        catRepo.create({ name: c.name, slug: c.slug, isActive: true }),
      );
      console.log(`   ✓ ${c.name}`);
    }
    catBySlug[c.slug] = parent;

    for (const ch of c.children) {
      let child = await catRepo.findOne({ where: { slug: ch.slug } });
      if (!child) {
        child = await catRepo.save(
          catRepo.create({
            name: ch.name,
            slug: ch.slug,
            parent,
            isActive: true,
          }),
        );
        console.log(`      ✓ ${ch.name}`);
      }
      catBySlug[ch.slug] = child;
    }
  }

  // ── 3. FOYDALANUVCHILAR ────────────────────────────────────────────────────
  console.log('\n👥  Foydalanuvchilar yaratilmoqda...');

  async function upsertUser(
    data: Partial<User> & { email: string },
  ): Promise<User> {
    let u = await userRepo.findOne({
      where: { email: data.email },
      relations: ['roles'],
    });
    if (!u) {
      u = await userRepo.save(userRepo.create(data));
      console.log(`   ✓ ${data.email}`);
    }
    return u;
  }

  const hashR = (p: string) => bcrypt.hash(p, HASH_ROUNDS);

  // ── Admin
  const admin = await upsertUser({
    email: 'admin@karvon.uz',
    passwordHash: await hashR(REAL_PASS),
    firstName: 'Sardor',
    lastName: 'Mirzayev',
    isVerified: true,
    isActive: true,
    isDemo: false,
    roles: [roleMap[RoleName.ADMIN]],
  });

  // ── Demo Admin
  const demoAdmin = await upsertUser({
    email: 'demo.admin@karvon.uz',
    passwordHash: await hashR(DEMO_PASS),
    firstName: 'Demo',
    lastName: 'Admin',
    isVerified: true,
    isActive: true,
    isDemo: true,
    roles: [roleMap[RoleName.ADMIN]],
  });

  // ── Sellerlar
  const seller1 = await upsertUser({
    email: 'techzone@karvon.uz',
    passwordHash: await hashR(REAL_PASS),
    firstName: 'Jahongir',
    lastName: 'Toshmatov',
    isVerified: true,
    isActive: true,
    isDemo: false,
    sellerStatus: SellerStatus.APPROVED,
    storeName: 'TechZone',
    storeDescription:
      "O'zbekistondagi eng yirik texnologiya do'koni. Barcha brendlarning original mahsulotlari.",
    roles: [roleMap[RoleName.SELLER]],
  });

  const seller2 = await upsertUser({
    email: 'fashionhub@karvon.uz',
    passwordHash: await hashR(REAL_PASS),
    firstName: 'Nilufar',
    lastName: 'Rahimova',
    isVerified: true,
    isActive: true,
    isDemo: false,
    sellerStatus: SellerStatus.APPROVED,
    storeName: 'FashionHub',
    storeDescription:
      'Zamonaviy va klassik kiyimlar. Dunyo brendlari bilan hamkorlik.',
    roles: [roleMap[RoleName.SELLER]],
  });

  const seller3 = await upsertUser({
    email: 'homestyle@karvon.uz',
    passwordHash: await hashR(REAL_PASS),
    firstName: 'Bobur',
    lastName: 'Usmonov',
    isVerified: true,
    isActive: true,
    isDemo: false,
    sellerStatus: SellerStatus.APPROVED,
    storeName: 'HomeStyle',
    storeDescription:
      'Uy uchun sifatli mebel va bezatish buyumlari. 5 yillik tajriba.',
    roles: [roleMap[RoleName.SELLER]],
  });

  // ── Demo Seller
  const demoSeller = await upsertUser({
    email: 'demo.seller@karvon.uz',
    passwordHash: await hashR(DEMO_PASS),
    firstName: 'Demo',
    lastName: 'Sotuvchi',
    isVerified: true,
    isActive: true,
    isDemo: true,
    sellerStatus: SellerStatus.APPROVED,
    storeName: "Demo Do'kon",
    storeDescription: "Bu demo hisob — faqat ko'rish uchun.",
    roles: [roleMap[RoleName.SELLER]],
  });

  // ── Buyerlar
  const buyers: User[] = [];
  const buyerData = [
    { email: 'alisher@karvon.uz', firstName: 'Alisher', lastName: 'Qodirov' },
    { email: 'kamola@karvon.uz', firstName: 'Kamola', lastName: 'Ergasheva' },
    { email: 'sherzod@karvon.uz', firstName: 'Sherzod', lastName: 'Nishonov' },
    { email: 'dilnoza@karvon.uz', firstName: 'Dilnoza', lastName: 'Hasanova' },
    { email: 'ulugbek@karvon.uz', firstName: 'Ulugbek', lastName: 'Yunusov' },
  ];

  for (const bd of buyerData) {
    const b = await upsertUser({
      ...bd,
      passwordHash: await hashR(REAL_PASS),
      isVerified: true,
      isActive: true,
      isDemo: false,
      roles: [roleMap[RoleName.BUYER]],
    });
    buyers.push(b);
  }

  // ── Demo Buyer
  const demoBuyer = await upsertUser({
    email: 'demo.user@karvon.uz',
    passwordHash: await hashR(DEMO_PASS),
    firstName: 'Demo',
    lastName: 'Foydalanuvchi',
    isVerified: true,
    isActive: true,
    isDemo: true,
    roles: [roleMap[RoleName.BUYER]],
  });

  // ── Kuryer
  const courier = await upsertUser({
    email: 'courier@karvon.uz',
    passwordHash: await hashR(REAL_PASS),
    firstName: 'Mansur',
    lastName: 'Karimov',
    isVerified: true,
    isActive: true,
    isDemo: false,
    roles: [roleMap[RoleName.DELIVERY]],
  });

  // ── 4. MAHSULOTLAR ─────────────────────────────────────────────────────────
  console.log('\n📦  Mahsulotlar yaratilmoqda...');

  type ProdDef = {
    seller: User;
    catSlug: string;
    name: string;
    slug: string;
    desc: string;
    shortDesc: string;
    price: number;
    discountPrice?: number;
    isFeatured?: boolean;
    ratingAvg?: number;
    ratingCount?: number;
    viewCount?: number;
    variants?: {
      sku: string;
      name: string;
      priceModifier: number;
      stock: number;
      attributes: Record<string, unknown>;
    }[];
  };

  const productDefs: ProdDef[] = [
    // ── TechZone — Smartfonlar
    {
      seller: seller1,
      catSlug: 'smartfonlar',
      name: 'Apple iPhone 15 Pro Max',
      slug: 'apple-iphone-15-pro-max',
      desc: "iPhone 15 Pro Max — Apple'ning eng ilg'or smartfoni. Titanium korpus, A17 Pro chip, 48MP kamera tizimi va USB-C port bilan jihozlangan.",
      shortDesc: 'Titanium, A17 Pro, 48MP kamera, USB-C',
      price: 16500000,
      discountPrice: 15990000,
      isFeatured: true,
      ratingAvg: 4.8,
      ratingCount: 247,
      viewCount: 8420,
      variants: [
        {
          sku: 'IP15PM-256-NT',
          name: '256GB Natural Titanium',
          priceModifier: 0,
          stock: 12,
          attributes: { storage: '256GB', color: 'Natural Titanium' },
        },
        {
          sku: 'IP15PM-512-BT',
          name: '512GB Black Titanium',
          priceModifier: 1500000,
          stock: 8,
          attributes: { storage: '512GB', color: 'Black Titanium' },
        },
        {
          sku: 'IP15PM-1T-BT',
          name: '1TB Black Titanium',
          priceModifier: 3000000,
          stock: 3,
          attributes: { storage: '1TB', color: 'Black Titanium' },
        },
      ],
    },
    {
      seller: seller1,
      catSlug: 'smartfonlar',
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      desc: "Galaxy S24 Ultra — Samsung'ning flagman modeli. Snapdragon 8 Gen 3, 200MP kamera, S Pen va 5000mAh batareya.",
      shortDesc: 'Snapdragon 8 Gen 3, 200MP, S Pen, 12GB RAM',
      price: 14200000,
      discountPrice: 13500000,
      isFeatured: true,
      ratingAvg: 4.7,
      ratingCount: 189,
      viewCount: 6230,
      variants: [
        {
          sku: 'SGS24U-256-TG',
          name: '256GB Titanium Gray',
          priceModifier: 0,
          stock: 15,
          attributes: { storage: '256GB', color: 'Titanium Gray' },
        },
        {
          sku: 'SGS24U-512-TB',
          name: '512GB Titanium Black',
          priceModifier: 1200000,
          stock: 7,
          attributes: { storage: '512GB', color: 'Titanium Black' },
        },
      ],
    },
    {
      seller: seller1,
      catSlug: 'smartfonlar',
      name: 'Xiaomi 14 Ultra',
      slug: 'xiaomi-14-ultra',
      desc: 'Xiaomi 14 Ultra — Leica kamerali flagman. Snapdragon 8 Gen 3, 50MP quad-kamera, HyperOS.',
      shortDesc: 'Leica quad-kamera, Snapdragon 8 Gen 3',
      price: 10800000,
      isFeatured: false,
      ratingAvg: 4.5,
      ratingCount: 94,
      viewCount: 3100,
      variants: [
        {
          sku: 'X14U-256-W',
          name: '256GB White',
          priceModifier: 0,
          stock: 10,
          attributes: { storage: '256GB', color: 'White' },
        },
        {
          sku: 'X14U-512-B',
          name: '512GB Black',
          priceModifier: 900000,
          stock: 5,
          attributes: { storage: '512GB', color: 'Black' },
        },
      ],
    },
    {
      seller: seller1,
      catSlug: 'smartfonlar',
      name: 'OnePlus 12',
      slug: 'oneplus-12',
      desc: 'OnePlus 12 — tez zaryad va yumshoq OxygenOS. 100W SuperVOOC, Hasselblad kamera.',
      shortDesc: '100W zaryad, Hasselblad, Snapdragon 8 Gen 3',
      price: 8900000,
      discountPrice: 8200000,
      ratingAvg: 4.4,
      ratingCount: 56,
      viewCount: 1890,
      variants: [
        {
          sku: 'OP12-256-SB',
          name: '256GB Silky Black',
          priceModifier: 0,
          stock: 18,
          attributes: { storage: '256GB', color: 'Silky Black' },
        },
        {
          sku: 'OP12-512-FG',
          name: '512GB Flowy Emerald',
          priceModifier: 700000,
          stock: 6,
          attributes: { storage: '512GB', color: 'Flowy Emerald' },
        },
      ],
    },

    // ── TechZone — Noutbuklar
    {
      seller: seller1,
      catSlug: 'noutbuklar',
      name: 'Apple MacBook Pro 14" M3 Pro',
      slug: 'apple-macbook-pro-14-m3-pro',
      desc: "MacBook Pro 14 dyuym — M3 Pro chip, Liquid Retina XDR ekran, 18GB RAM, 512GB SSD. Professional ish uchun eng zo'r tanlov.",
      shortDesc: 'M3 Pro chip, 18GB RAM, 512GB SSD, 18 soat batareya',
      price: 31500000,
      isFeatured: true,
      ratingAvg: 4.9,
      ratingCount: 312,
      viewCount: 11200,
      variants: [
        {
          sku: 'MBP14-M3P-18-512-SG',
          name: '18GB / 512GB Space Gray',
          priceModifier: 0,
          stock: 5,
          attributes: { ram: '18GB', storage: '512GB', color: 'Space Gray' },
        },
        {
          sku: 'MBP14-M3P-36-1T-SG',
          name: '36GB / 1TB Space Gray',
          priceModifier: 6000000,
          stock: 3,
          attributes: { ram: '36GB', storage: '1TB', color: 'Space Gray' },
        },
        {
          sku: 'MBP14-M3P-18-512-S',
          name: '18GB / 512GB Silver',
          priceModifier: 0,
          stock: 4,
          attributes: { ram: '18GB', storage: '512GB', color: 'Silver' },
        },
      ],
    },
    {
      seller: seller1,
      catSlug: 'noutbuklar',
      name: 'Dell XPS 15 (2024)',
      slug: 'dell-xps-15-2024',
      desc: 'Dell XPS 15 — Intel Core Ultra 9, 32GB DDR5, NVIDIA RTX 4070. 15.6" OLED ekran, ultra-slim dizayn.',
      shortDesc: 'Core Ultra 9, RTX 4070, 32GB DDR5, OLED',
      price: 24800000,
      discountPrice: 23200000,
      ratingAvg: 4.6,
      ratingCount: 78,
      viewCount: 2850,
      variants: [
        {
          sku: 'DXPS15-32-1T',
          name: '32GB / 1TB',
          priceModifier: 0,
          stock: 7,
          attributes: { ram: '32GB', storage: '1TB' },
        },
        {
          sku: 'DXPS15-64-2T',
          name: '64GB / 2TB',
          priceModifier: 4500000,
          stock: 2,
          attributes: { ram: '64GB', storage: '2TB' },
        },
      ],
    },
    {
      seller: seller1,
      catSlug: 'noutbuklar',
      name: 'ASUS ROG Zephyrus G16',
      slug: 'asus-rog-zephyrus-g16',
      desc: 'ASUS ROG Zephyrus G16 — AMD Ryzen 9 8945HS, RTX 4090, 240Hz QHD+ ekran. Gaming laptop.',
      shortDesc: 'Ryzen 9 8945HS, RTX 4090, 32GB, 240Hz',
      price: 28900000,
      ratingAvg: 4.7,
      ratingCount: 43,
      viewCount: 1650,
      variants: [
        {
          sku: 'ROG-G16-32-1T-W',
          name: '32GB / 1TB White',
          priceModifier: 0,
          stock: 4,
          attributes: { ram: '32GB', storage: '1TB', color: 'White' },
        },
        {
          sku: 'ROG-G16-32-1T-B',
          name: '32GB / 1TB Black',
          priceModifier: 0,
          stock: 4,
          attributes: { ram: '32GB', storage: '1TB', color: 'Black' },
        },
      ],
    },

    // ── TechZone — Audio
    {
      seller: seller1,
      catSlug: 'audio-video',
      name: 'Apple AirPods Pro 2',
      slug: 'apple-airpods-pro-2',
      desc: 'AirPods Pro 2 — H2 chip, kuchli ANC, Adaptive Audio. USB-C qutisi bilan.',
      shortDesc: 'H2 chip, ANC, Adaptive Audio, USB-C case',
      price: 3200000,
      discountPrice: 2990000,
      isFeatured: true,
      ratingAvg: 4.8,
      ratingCount: 521,
      viewCount: 14300,
    },
    {
      seller: seller1,
      catSlug: 'audio-video',
      name: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      desc: 'Sony WH-1000XM5 — dunyodagi eng yaxshi ANC quloqchin. 30 soat batareya, multipoint ulanish.',
      shortDesc: 'Sanoatdagi eng yaxshi ANC, 30 soat batareya',
      price: 2800000,
      discountPrice: 2500000,
      ratingAvg: 4.7,
      ratingCount: 284,
      viewCount: 7100,
      variants: [
        {
          sku: 'WH1000XM5-B',
          name: 'Qora',
          priceModifier: 0,
          stock: 20,
          attributes: { color: 'Black' },
        },
        {
          sku: 'WH1000XM5-S',
          name: 'Kumush',
          priceModifier: 0,
          stock: 15,
          attributes: { color: 'Silver' },
        },
      ],
    },
    {
      seller: seller1,
      catSlug: 'aksessuarlar',
      name: 'Anker MagSafe 3-in-1 Charger',
      slug: 'anker-magsafe-3-in-1-charger',
      desc: "Anker 3-in-1 sto'l zaryadlovchi — iPhone, AirPods va Apple Watch uchun. 15W MagSafe quvvat.",
      shortDesc: 'iPhone + AirPods + Apple Watch, 15W MagSafe',
      price: 980000,
      discountPrice: 850000,
      ratingAvg: 4.5,
      ratingCount: 167,
      viewCount: 4200,
    },

    // ── FashionHub — Erkaklar
    {
      seller: seller2,
      catSlug: 'erkaklar-kiyimi',
      name: "Erkaklar klassik ko'ylagi — Oxford",
      slug: 'erkaklar-klassik-koylagi-oxford',
      desc: '100% paxta Oxford matosi. Rasmiy uchrashuv va ish uchun ideal. 5 xil rangda mavjud.',
      shortDesc: "100% paxta, rasmiy ko'ylak, 5 rang",
      price: 280000,
      discountPrice: 240000,
      ratingAvg: 4.3,
      ratingCount: 89,
      viewCount: 2100,
      variants: [
        {
          sku: 'KOY-OXF-S-W',
          name: 'S — Oq',
          priceModifier: 0,
          stock: 30,
          attributes: { size: 'S', color: 'Oq' },
        },
        {
          sku: 'KOY-OXF-M-W',
          name: 'M — Oq',
          priceModifier: 0,
          stock: 40,
          attributes: { size: 'M', color: 'Oq' },
        },
        {
          sku: 'KOY-OXF-L-W',
          name: 'L — Oq',
          priceModifier: 0,
          stock: 35,
          attributes: { size: 'L', color: 'Oq' },
        },
        {
          sku: 'KOY-OXF-M-B',
          name: "M — Ko'k",
          priceModifier: 0,
          stock: 25,
          attributes: { size: 'M', color: "Ko'k" },
        },
        {
          sku: 'KOY-OXF-L-B',
          name: "L — Ko'k",
          priceModifier: 0,
          stock: 20,
          attributes: { size: 'L', color: "Ko'k" },
        },
      ],
    },
    {
      seller: seller2,
      catSlug: 'erkaklar-kiyimi',
      name: 'Erkaklar slim-fit shim — Chino',
      slug: 'erkaklar-slim-fit-shim-chino',
      desc: "Zamonaviy slim-fit chino. Elastan qo'shilgan, qulay va ko'rinishli.",
      shortDesc: 'Slim-fit, elastan, 3 rang',
      price: 320000,
      ratingAvg: 4.2,
      ratingCount: 62,
      viewCount: 1400,
      variants: [
        {
          sku: 'CH-30-BEG',
          name: '30 — Beige',
          priceModifier: 0,
          stock: 20,
          attributes: { size: '30', color: 'Beige' },
        },
        {
          sku: 'CH-32-BEG',
          name: '32 — Beige',
          priceModifier: 0,
          stock: 25,
          attributes: { size: '32', color: 'Beige' },
        },
        {
          sku: 'CH-34-NAV',
          name: '34 — Navy',
          priceModifier: 0,
          stock: 18,
          attributes: { size: '34', color: 'Navy' },
        },
        {
          sku: 'CH-36-KHK',
          name: '36 — Khaki',
          priceModifier: 0,
          stock: 15,
          attributes: { size: '36', color: 'Khaki' },
        },
      ],
    },
    {
      seller: seller2,
      catSlug: 'sport-kiyimlari',
      name: 'Nike Dri-FIT Training T-shirt',
      slug: 'nike-dri-fit-training-t-shirt',
      desc: 'Nike Dri-FIT texnologiyasi — sport paytida quruq saqlaydi. Gym va yugurish uchun.',
      shortDesc: 'Dri-FIT, moisture-wicking, unisex',
      price: 195000,
      discountPrice: 165000,
      ratingAvg: 4.6,
      ratingCount: 134,
      viewCount: 3200,
      variants: [
        {
          sku: 'NDT-S-BLK',
          name: 'S — Black',
          priceModifier: 0,
          stock: 50,
          attributes: { size: 'S', color: 'Black' },
        },
        {
          sku: 'NDT-M-BLK',
          name: 'M — Black',
          priceModifier: 0,
          stock: 60,
          attributes: { size: 'M', color: 'Black' },
        },
        {
          sku: 'NDT-L-BLK',
          name: 'L — Black',
          priceModifier: 0,
          stock: 45,
          attributes: { size: 'L', color: 'Black' },
        },
        {
          sku: 'NDT-M-WHT',
          name: 'M — White',
          priceModifier: 0,
          stock: 40,
          attributes: { size: 'M', color: 'White' },
        },
        {
          sku: 'NDT-L-WHT',
          name: 'L — White',
          priceModifier: 0,
          stock: 35,
          attributes: { size: 'L', color: 'White' },
        },
      ],
    },

    // ── HomeStyle — Mebel & Oshxona
    {
      seller: seller3,
      catSlug: 'mebel',
      name: 'Skandinav uslubidagi ish stoli',
      slug: 'skandinav-ish-stoli',
      desc: "Eman yog'ochidan yasalgan minimalist ish stoli. 140x70 sm, 3 ta tortma, simlar uchun teshik.",
      shortDesc: 'Eman, 140x70sm, 3 tortma, kabel boshqaruvi',
      price: 2800000,
      discountPrice: 2500000,
      isFeatured: true,
      ratingAvg: 4.4,
      ratingCount: 38,
      viewCount: 1100,
      variants: [
        {
          sku: 'SD-140-OAK',
          name: 'Eman rangi',
          priceModifier: 0,
          stock: 8,
          attributes: { color: 'Oak', size: '140x70' },
        },
        {
          sku: 'SD-140-WHT',
          name: 'Oq',
          priceModifier: 0,
          stock: 6,
          attributes: { color: 'White', size: '140x70' },
        },
        {
          sku: 'SD-160-OAK',
          name: 'Eman, 160sm',
          priceModifier: 500000,
          stock: 4,
          attributes: { color: 'Oak', size: '160x70' },
        },
      ],
    },
    {
      seller: seller3,
      catSlug: 'mebel',
      name: 'Ergonomik ofis kreslo',
      slug: 'ergonomik-ofis-kreslo',
      desc: "Lumbopelvic qo'llab-quvvatlash, regulyatsiya qilinadigan qo'ltiqchalar, 4D bosh qo'yg'ich. Meshli orqa.",
      shortDesc: "Mesh orqa, 4D qo'ltiqcha, aylanuvchi",
      price: 3200000,
      ratingAvg: 4.6,
      ratingCount: 71,
      viewCount: 2300,
      variants: [
        {
          sku: 'OFK-BLK',
          name: 'Qora',
          priceModifier: 0,
          stock: 12,
          attributes: { color: 'Black' },
        },
        {
          sku: 'OFK-GRY',
          name: 'Kulrang',
          priceModifier: 0,
          stock: 8,
          attributes: { color: 'Gray' },
        },
        {
          sku: 'OFK-EXC',
          name: 'Executive (charm)',
          priceModifier: 800000,
          stock: 3,
          attributes: { color: 'Leather Black' },
        },
      ],
    },
    {
      seller: seller3,
      catSlug: 'oshxona-buyumlari',
      name: "Tefal Ingenio Unlimited qozon to'plami (13 dona)",
      slug: 'tefal-ingenio-unlimited-13',
      desc: "Tefal Ingenio Unlimited — 13 donali to'plam. PFOA-free, titanium qoplama, barcha plitalarga mos.",
      shortDesc: '13 donali, titanium, induktiv va gazga mos',
      price: 1850000,
      discountPrice: 1600000,
      isFeatured: true,
      ratingAvg: 4.7,
      ratingCount: 203,
      viewCount: 5800,
    },
    {
      seller: seller3,
      catSlug: 'oshxona-buyumlari',
      name: 'Philips Airfryer XXL',
      slug: 'philips-airfryer-xxl',
      desc: "Philips Airfryer XXL — 7.3L hajm, Rapid Air texnologiyasi. Yog'siz, sog'lom taomlar.",
      shortDesc: "7.3L, yog'siz, 7 dastur, 1700W",
      price: 2200000,
      discountPrice: 1980000,
      ratingAvg: 4.5,
      ratingCount: 117,
      viewCount: 3400,
    },
    {
      seller: seller3,
      catSlug: 'bezatish',
      name: "Aromatik sham to'plami — Lavanda",
      slug: 'aromatik-sham-toplami-lavanda',
      desc: "Qo'lda ishlangan soya sham to'plami. Lavanda, vanil va yog'och hidi. 3 ta 200g sham.",
      shortDesc: '3x200g soya mum, 45 soat yonish muddati',
      price: 185000,
      discountPrice: 155000,
      ratingAvg: 4.8,
      ratingCount: 89,
      viewCount: 1200,
      variants: [
        {
          sku: 'SHAM-LAV-S',
          name: "Kichik to'plam (3x100g)",
          priceModifier: -50000,
          stock: 30,
          attributes: { size: 'Small' },
        },
        {
          sku: 'SHAM-LAV-M',
          name: "O'rta to'plam (3x200g)",
          priceModifier: 0,
          stock: 25,
          attributes: { size: 'Medium' },
        },
        {
          sku: 'SHAM-LAV-L',
          name: "Katta to'plam (3x300g)",
          priceModifier: 50000,
          stock: 15,
          attributes: { size: 'Large' },
        },
      ],
    },

    // ── Sport
    {
      seller: seller3,
      catSlug: 'fitnes-uskunalari',
      name: 'Adjustable Dumbbell Set 5-52.5 lb',
      slug: 'adjustable-dumbbell-set-5-52',
      desc: "Bowflex SelectTech 552 — 1 dumbell ichida 15 og'irlik. 2.5 dan 24 kg gacha. Joy tejovchi.",
      shortDesc: "2.5–24 kg, 15 daraja, 2 dona to'plam",
      price: 3500000,
      ratingAvg: 4.6,
      ratingCount: 52,
      viewCount: 1600,
    },
  ];

  const products: Product[] = [];
  for (const def of productDefs) {
    const exists = await productRepo.findOne({ where: { slug: def.slug } });
    if (exists) {
      products.push(exists);
      continue;
    }

    const p = await productRepo.save(
      productRepo.create({
        sellerId: def.seller.id,
        categoryId: catBySlug[def.catSlug].id,
        name: def.name,
        slug: def.slug,
        description: def.desc,
        shortDescription: def.shortDesc,
        basePrice: String(def.price),
        discountPrice: def.discountPrice ? String(def.discountPrice) : null,
        discountEndsAt: def.discountPrice
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
        status: ProductStatus.ACTIVE,
        isFeatured: def.isFeatured ?? false,
        ratingAvg: String(def.ratingAvg ?? 0),
        ratingCount: def.ratingCount ?? 0,
        viewCount: def.viewCount ?? 0,
      }),
    );

    if (def.variants) {
      for (const v of def.variants) {
        await variantRepo.save(
          variantRepo.create({
            productId: p.id,
            sku: v.sku,
            name: v.name,
            priceModifier: String(v.priceModifier),
            stockQuantity: v.stock,
            attributes: v.attributes,
            isActive: true,
          }),
        );
      }
    }

    products.push(p);
    console.log(`   ✓ Mahsulot: ${def.name}`);
  }

  // ── 5. KUPONLAR ────────────────────────────────────────────────────────────
  console.log('\n🎟️   Kuponlar yaratilmoqda...');

  const coupons: {
    code: string;
    type: CouponType;
    value: number;
    minOrder?: number;
    maxDiscount?: number;
    usageLimit?: number;
    validUntil?: Date;
    desc: string;
  }[] = [
    {
      code: 'WELCOME10',
      type: CouponType.PERCENTAGE,
      value: 10,
      usageLimit: 500,
      validUntil: new Date('2027-01-01'),
      desc: '10% yangi foydalanuvchilar uchun',
    },
    {
      code: 'SUMMER25',
      type: CouponType.PERCENTAGE,
      value: 25,
      minOrder: 500000,
      maxDiscount: 300000,
      usageLimit: 200,
      validUntil: new Date('2026-09-01'),
      desc: '25% yozgi chegirma',
    },
    {
      code: 'TECH50K',
      type: CouponType.FIXED,
      value: 50000,
      minOrder: 300000,
      usageLimit: 1000,
      validUntil: new Date('2026-12-31'),
      desc: "50,000 so'm chegirma",
    },
    {
      code: 'VIP500K',
      type: CouponType.FIXED,
      value: 500000,
      minOrder: 5000000,
      usageLimit: 50,
      validUntil: new Date('2026-07-01'),
      desc: 'VIP mijozlar uchun 500K chegirma',
    },
    {
      code: 'EXPIRED',
      type: CouponType.PERCENTAGE,
      value: 15,
      usageLimit: 100,
      validUntil: new Date('2024-01-01'),
      desc: "Muddati o'tgan (test)",
    },
  ];

  for (const c of coupons) {
    const exists = await couponRepo.findOne({ where: { code: c.code } });
    if (!exists) {
      await couponRepo.save(
        couponRepo.create({
          code: c.code,
          type: c.type,
          value: String(c.value),
          minOrderAmount: c.minOrder ? String(c.minOrder) : null,
          maxDiscountAmount: c.maxDiscount ? String(c.maxDiscount) : null,
          usageLimit: c.usageLimit ?? null,
          usageCount: 0,
          validUntil: c.validUntil ?? null,
          isActive: true,
        }),
      );
      console.log(`   ✓ Kupon: ${c.code}`);
    }
  }

  // ── 6. BUYURTMALAR ─────────────────────────────────────────────────────────
  console.log('\n🛒  Buyurtmalar yaratilmoqda...');

  const addr = (region: string, city: string, street: string) => ({
    region,
    city,
    street,
    zip: '100100',
  });

  type OrderDef = {
    buyer: User;
    seller: User;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    items: { product: Product; qty: number; unitPrice: number }[];
    couponCode?: string;
    discountAmount?: number;
    notes?: string;
    orderNum: string;
  };

  const orderDefs: OrderDef[] = [
    // Yetkazilgan buyurtmalar
    {
      orderNum: 'ORD-2026-001',
      buyer: buyers[0],
      seller: seller1,
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.PAYME,
      paymentStatus: PaymentStatus.PAID,
      items: [{ product: products[7], qty: 1, unitPrice: 2990000 }],
      notes: 'Tez yetkazib bering',
    },
    {
      orderNum: 'ORD-2026-002',
      buyer: buyers[1],
      seller: seller1,
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.CLICK,
      paymentStatus: PaymentStatus.PAID,
      items: [
        { product: products[0], qty: 1, unitPrice: 15990000 },
        { product: products[7], qty: 1, unitPrice: 2990000 },
      ],
      couponCode: 'WELCOME10',
    },
    {
      orderNum: 'ORD-2026-003',
      buyer: buyers[2],
      seller: seller3,
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PAID,
      items: [{ product: products[14], qty: 1, unitPrice: 1600000 }],
    },
    {
      orderNum: 'ORD-2026-004',
      buyer: buyers[3],
      seller: seller2,
      status: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.PAYME,
      paymentStatus: PaymentStatus.PAID,
      items: [
        { product: products[10], qty: 2, unitPrice: 240000 },
        { product: products[12], qty: 1, unitPrice: 165000 },
      ],
    },

    // Jo'natilgan
    {
      orderNum: 'ORD-2026-005',
      buyer: buyers[4],
      seller: seller1,
      status: OrderStatus.SHIPPED,
      paymentMethod: PaymentMethod.UZUM,
      paymentStatus: PaymentStatus.PAID,
      items: [{ product: products[1], qty: 1, unitPrice: 13500000 }],
    },
    {
      orderNum: 'ORD-2026-006',
      buyer: buyers[0],
      seller: seller3,
      status: OrderStatus.SHIPPED,
      paymentMethod: PaymentMethod.PAYME,
      paymentStatus: PaymentStatus.PAID,
      items: [
        { product: products[13], qty: 1, unitPrice: 2500000 },
        { product: products[16], qty: 2, unitPrice: 155000 },
      ],
      couponCode: 'TECH50K',
    },

    // Tayyorlanmoqda
    {
      orderNum: 'ORD-2026-007',
      buyer: buyers[1],
      seller: seller1,
      status: OrderStatus.PROCESSING,
      paymentMethod: PaymentMethod.CLICK,
      paymentStatus: PaymentStatus.PAID,
      items: [{ product: products[4], qty: 1, unitPrice: 31500000 }],
      notes: "So'q rangli be, agar bo'lsa",
    },

    // Tasdiqlangan
    {
      orderNum: 'ORD-2026-008',
      buyer: buyers[2],
      seller: seller1,
      status: OrderStatus.CONFIRMED,
      paymentMethod: PaymentMethod.PAYME,
      paymentStatus: PaymentStatus.PAID,
      items: [{ product: products[8], qty: 1, unitPrice: 2500000 }],
    },
    {
      orderNum: 'ORD-2026-009',
      buyer: buyers[3],
      seller: seller3,
      status: OrderStatus.CONFIRMED,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PENDING,
      items: [{ product: products[14], qty: 1, unitPrice: 1600000 }],
    },

    // Kutilmoqda (to'lanmagan onlayn)
    {
      orderNum: 'ORD-2026-010',
      buyer: buyers[4],
      seller: seller1,
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.PAYME,
      paymentStatus: PaymentStatus.PENDING,
      items: [{ product: products[2], qty: 1, unitPrice: 10800000 }],
    },
    {
      orderNum: 'ORD-2026-011',
      buyer: buyers[0],
      seller: seller2,
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.UZUM,
      paymentStatus: PaymentStatus.PENDING,
      items: [
        { product: products[11], qty: 2, unitPrice: 320000 },
        { product: products[12], qty: 3, unitPrice: 165000 },
      ],
    },

    // Bekor qilingan
    {
      orderNum: 'ORD-2026-012',
      buyer: buyers[1],
      seller: seller1,
      status: OrderStatus.CANCELLED,
      paymentMethod: PaymentMethod.CLICK,
      paymentStatus: PaymentStatus.CANCELLED,
      items: [{ product: products[3], qty: 1, unitPrice: 8200000 }],
      notes: "Qaror o'zgardi",
    },
    {
      orderNum: 'ORD-2026-013',
      buyer: buyers[2],
      seller: seller3,
      status: OrderStatus.CANCELLED,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.CANCELLED,
      items: [{ product: products[15], qty: 1, unitPrice: 3200000 }],
    },

    // Qaytarilgan
    {
      orderNum: 'ORD-2026-014',
      buyer: buyers[3],
      seller: seller1,
      status: OrderStatus.REFUNDED,
      paymentMethod: PaymentMethod.PAYME,
      paymentStatus: PaymentStatus.REFUNDED,
      items: [{ product: products[5], qty: 1, unitPrice: 23200000 }],
      notes: 'Mahsulot tavsifga mos kelmadi',
    },
  ];

  const createdOrders: Order[] = [];
  for (const def of orderDefs) {
    const exists = await orderRepo.findOne({
      where: { orderNumber: def.orderNum },
    });
    if (exists) {
      createdOrders.push(exists);
      continue;
    }

    const totalAmount = def.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const discountAmount = def.discountAmount ?? 0;
    const finalAmount = totalAmount - discountAmount;

    const order = await orderRepo.save(
      orderRepo.create({
        orderNumber: def.orderNum,
        buyerId: def.buyer.id,
        sellerId: def.seller.id,
        status: def.status,
        paymentMethod: def.paymentMethod,
        paymentStatus: def.paymentStatus,
        totalAmount: String(totalAmount),
        discountAmount: String(discountAmount),
        finalAmount: String(finalAmount),
        shippingAddress: addr('Toshkent', 'Toshkent', "Amir Temur ko'chasi, 1"),
        notes: def.notes ?? null,
        cancelledReason:
          def.status === OrderStatus.CANCELLED
            ? (def.notes ?? 'Foydalanuvchi istaklari')
            : null,
      }),
    );

    for (const item of def.items) {
      await orderItemRepo.save(
        orderItemRepo.create({
          orderId: order.id,
          productId: item.product.id,
          productName: item.product.name,
          productImage: null,
          quantity: item.qty,
          unitPrice: String(item.unitPrice),
          totalPrice: String(item.unitPrice * item.qty),
          variantId: null,
        }),
      );
    }

    // Status tarixini yozamiz
    const statusFlow: OrderStatus[] = [];
    if (
      [
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
      ].includes(def.status)
    ) {
      statusFlow.push(OrderStatus.PENDING, OrderStatus.CONFIRMED);
    }
    if (
      [
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
      ].includes(def.status)
    ) {
      statusFlow.push(OrderStatus.PROCESSING);
    }
    if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(def.status)) {
      statusFlow.push(OrderStatus.SHIPPED);
    }
    if (def.status === OrderStatus.DELIVERED)
      statusFlow.push(OrderStatus.DELIVERED);
    if (def.status === OrderStatus.CANCELLED)
      statusFlow.push(OrderStatus.PENDING, OrderStatus.CANCELLED);
    if (def.status === OrderStatus.REFUNDED)
      statusFlow.push(
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.REFUNDED,
      );
    if (def.status === OrderStatus.PENDING)
      statusFlow.push(OrderStatus.PENDING);

    for (let i = 0; i < statusFlow.length; i++) {
      await historyRepo.save(
        historyRepo.create({
          orderId: order.id,
          fromStatus: i > 0 ? statusFlow[i - 1] : null,
          toStatus: statusFlow[i],
          changedById: admin.id,
          note:
            statusFlow[i] === OrderStatus.DELIVERED ? 'Yetkazib berildi' : null,
        }),
      );
    }

    createdOrders.push(order);
    console.log(`   ✓ Buyurtma: ${def.orderNum} [${def.status}]`);
  }

  // ── 7. DELIVERY ────────────────────────────────────────────────────────────
  console.log('\n🚚  Delivery yozuvlari yaratilmoqda...');
  const deliveryOrders = createdOrders.filter((o) =>
    [OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(
      o.status as OrderStatus,
    ),
  );

  for (const order of deliveryOrders) {
    const exists = await deliveryRepo.findOne({ where: { orderId: order.id } });
    if (!exists) {
      await deliveryRepo.save(
        deliveryRepo.create({
          orderId: order.id,
          courierId: courier.id,
          status:
            order.status === OrderStatus.DELIVERED
              ? DeliveryStatus.DELIVERED
              : DeliveryStatus.ON_THE_WAY,
          pickupAddress: {
            region: 'Toshkent',
            city: 'Toshkent',
            street: "Do'kon ombori, Chilonzor",
          },
          deliveryAddress: addr(
            'Toshkent',
            'Toshkent',
            "Amir Temur ko'chasi, 1",
          ),
          estimatedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          deliveredAt:
            order.status === OrderStatus.DELIVERED
              ? new Date(Date.now() - 2 * 60 * 60 * 1000)
              : null,
          notes: "Qo'ng'iroq qilish shart",
        }),
      );
      console.log(`   ✓ Delivery: ${order.orderNumber}`);
    }
  }

  // ── 8. SHARHLAR ────────────────────────────────────────────────────────────
  console.log('\n⭐  Sharhlar yaratilmoqda...');

  const reviewDefs: {
    product: Product;
    user: User;
    order?: Order;
    rating: number;
    title: string;
    body: string;
    sellerReply?: string;
  }[] = [
    // AirPods Pro 2
    {
      product: products[7],
      user: buyers[0],
      order: createdOrders[0],
      rating: 5,
      title: "Zo'r quloqchin!",
      body: "Shovqin o'chirish ajoyib ishlaydi. Apple Watch bilan muammosiz ulanadi. Pul arziydi!",
      sellerReply: "Rahmat! Savol bo'lsa murojaat qiling.",
    },
    {
      product: products[7],
      user: buyers[2],
      rating: 4,
      title: 'Yaxshi, lekin qutisi kichik',
      body: 'Sifat yuqori. Faqat quti oldingi versiyaga qaraganda kichikroq. Ovoz tozaligi mukammal.',
    },
    {
      product: products[7],
      user: buyers[4],
      rating: 5,
      title: 'Eng yaxshi quloqchin',
      body: 'Spotify va Netflix uchun ideal. ANC har qanday muhitda ishlaydi.',
    },

    // iPhone 15 Pro Max
    {
      product: products[0],
      user: buyers[1],
      order: createdOrders[1],
      rating: 5,
      title: 'Titanium corpus — ajoyib',
      body: "Kamera sifati Apple'ning eng yaxshisi. A17 Pro chip hamma narsani bir zumda bajaradi. Dynamic Island ham foydali.",
      sellerReply: "Rahmat obro'li fikr uchun!",
    },
    {
      product: products[0],
      user: buyers[3],
      rating: 4,
      title: 'Yaxshi, narxi baland',
      body: "Texnik imkoniyatlari zo'r. Faqat narxi juda baland. USB-C o'tish yaxshi bo'ldi.",
    },

    // MacBook Pro M3
    {
      product: products[4],
      user: buyers[1],
      order: createdOrders[6],
      rating: 5,
      title: 'Dasturchilar uchun ideal',
      body: 'Docker, Xcode, Android Studio — hammasini bir vaqtda ishlatsa ham qizimaydi. 18 soat batareya haqiqat!',
      sellerReply: 'Xaridingiz uchun rahmat!',
    },
    {
      product: products[4],
      user: buyers[4],
      rating: 5,
      title: "Video editing uchun zo'r",
      body: '4K Pro Res export 3 daqiqada. Final Cut Pro M3 Pro bilan uchadi.',
    },

    // Samsung S24 Ultra
    {
      product: products[1],
      user: buyers[4],
      order: createdOrders[4],
      rating: 5,
      title: "S Pen — o'zgacha tajriba",
      body: "200MP kamera tunda ham ajoyib. S Pen bilan eslatmalar yozish qulay. DeX rejimi laptop o'rnini bosadi.",
    },
    {
      product: products[1],
      user: buyers[2],
      rating: 4,
      title: "Kuchli, biroz og'ir",
      body: "Snapdragon 8 Gen 3 hech bir muammosiz. Batareya 1.5 kun yetadi. Faqat 228 gramm og'irlik seziladi.",
    },

    // Tefal Qozon
    {
      product: products[15],
      user: buyers[2],
      order: createdOrders[2],
      rating: 5,
      title: 'Oilam xursand',
      body: "13 donali to'plam har narsa uchun yetarli. Titanium qoplama hech yopishmasdi. Induksiyaga mos.",
      sellerReply: "Sog'lom ovqatlar uchun vosita bo'lsin!",
    },
    {
      product: products[15],
      user: buyers[0],
      rating: 4,
      title: "Sifatli to'plam",
      body: "6 oydan beri ishlatmoqdaman. Sirt buzilmagan. Faqat qozonlar bir-biriga qattiq kirib qoladi ba'zan.",
    },

    // Skandinav stol
    {
      product: products[13],
      user: buyers[0],
      order: createdOrders[5],
      rating: 5,
      title: 'Uyim bezatildi',
      body: "140sm stol keng. 3 tortma hamma narsani sig'diradi. Yig'ish 40 daqiqa ketdi, video yo'riqnoma bor.",
      sellerReply: "Xursand bo'ldingiz, biz ham xursandmiz!",
    },

    // Nike T-shirt
    {
      product: products[12],
      user: buyers[3],
      order: createdOrders[3],
      rating: 5,
      title: 'Gym uchun ideal',
      body: 'Dri-FIT ishlaydi. 1 soatlik trenirovkadan keyin ham quruq his qilamiz. XL ham bor ekan, yaxshi.',
    },
    {
      product: products[12],
      user: buyers[0],
      rating: 4,
      title: 'Yaxshi sifat',
      body: '20 marta yuvishdan keyin ham rang ketmadi. Faqat M razmer kichikroq tuyuldi.',
    },

    // Ofis kreslo
    {
      product: products[14],
      user: buyers[1],
      rating: 5,
      title: "Bel og'rig'i o'tdi",
      body: "3 oydan beri kuniga 10 soat o'tiradigan bo'ldim. Bel og'rig'i yo'qoldi. Lumbopelvic support ishlaydi.",
    },
    {
      product: products[14],
      user: buyers[4],
      rating: 4,
      title: 'Ishdan chiqmaydigan',
      body: "2 yildan beri ishlatmoqdaman. Siqircha aylanadi, qo'ltiqchalar 4 yo'nalishga sozlanadi.",
    },

    // Airfryer
    {
      product: products[16],
      user: buyers[2],
      rating: 5,
      title: "Sog'lom ovqat engil",
      body: 'Kartoshka, tovuq — hammasi juda mazali chiqadi. Elektr sarfi ham kam.',
    },
    {
      product: products[16],
      user: buyers[3],
      rating: 4,
      title: "Katta oila uchun zo'r",
      body: "7.3L hajm 4-5 kishilik oilaga yetadi. 30 daqiqada to'liq ovqat tayyor.",
    },

    // Sony WH-1000XM5
    {
      product: products[8],
      user: buyers[2],
      order: createdOrders[7],
      rating: 5,
      title: 'Metro va samolyotda ajoyib',
      body: "ANC samolyotda shunday ishlaydi — motorni butunlay yo'q qiladi. Multipoint — telefon va laptop parallel.",
    },
    {
      product: products[8],
      user: buyers[1],
      rating: 5,
      title: 'Mukammal quloqchin',
      body: 'Sony codec LDAC bilan lossless musiqani eshitish boshqacha zavq.',
    },

    // Dumbbell
    {
      product: products[18],
      user: buyers[0],
      rating: 5,
      title: 'Uyda gym',
      body: "1 dona dumbell 15 ta og'irlikni almashtiradi. Joy kamroq ketadi. Plastinka almashish tez.",
    },
    {
      product: products[18],
      user: buyers[4],
      rating: 4,
      title: 'Sifatli, lekin narxi yuqori',
      body: "Mexanizm ishonchli. Yillar ishlaydi. Faqat 3.5M so'm oddiy dumbbell uchun ko'p bo'lsa ham, joy tejash arziydi.",
    },
  ];

  for (const rd of reviewDefs) {
    const existing = await reviewRepo.findOne({
      where: { productId: rd.product.id, userId: rd.user.id },
    });
    if (!existing) {
      await reviewRepo.save(
        reviewRepo.create({
          productId: rd.product.id,
          userId: rd.user.id,
          orderId: rd.order?.id ?? null,
          rating: rd.rating,
          title: rd.title,
          body: rd.body,
          sellerReply: rd.sellerReply ?? null,
          isVerifiedPurchase: !!rd.order,
          isPublished: true,
        }),
      );
    }
  }
  console.log(`   ✓ ${reviewDefs.length} ta sharh yaratildi`);

  // ── 9. BILDIRISHNOMALAR ────────────────────────────────────────────────────
  console.log('\n🔔  Bildirishnomalar yaratilmoqda...');

  const notifs: {
    user: User;
    type: NotificationType;
    title: string;
    body: string;
  }[] = [
    {
      user: demoBuyer,
      type: NotificationType.ORDER_STATUS,
      title: "Buyurtmangiz jo'natildi",
      body: 'ORD-2026-005 buyurtmangiz kuryer tomonidan olib ketildi.',
    },
    {
      user: demoBuyer,
      type: NotificationType.PROMO,
      title: 'Yangi aksiya!',
      body: 'SUMMER25 kuponi bilan 25% chegirma. Faqat shu oy!',
    },
    {
      user: demoBuyer,
      type: NotificationType.ORDER_STATUS,
      title: 'Buyurtmangiz tasdiqlandi',
      body: 'ORD-2026-008 buyurtmangiz sotuvchi tomonidan tasdiqlandi.',
    },
    {
      user: demoBuyer,
      type: NotificationType.SYSTEM,
      title: 'Profil yangilandi',
      body: 'Sizning profilingiz muvaffaqiyatli yangilandi.',
    },
    {
      user: demoSeller,
      type: NotificationType.ORDER_STATUS,
      title: 'Yangi buyurtma!',
      body: 'ORD-2026-010 - yangi buyurtma keldi. Tez tasdiqlang!',
    },
    {
      user: demoSeller,
      type: NotificationType.REVIEW,
      title: 'Yangi sharh',
      body: 'iPhone 15 Pro Max ga 5 yulduzli sharh yozildi.',
    },
    {
      user: demoSeller,
      type: NotificationType.PROMO,
      title: "Mahsulotlaringiz ko'rildi",
      body: "Bu hafta 1,200 ta ko'rishlar. Eng ommabop: AirPods Pro 2.",
    },
    {
      user: buyers[0],
      type: NotificationType.ORDER_STATUS,
      title: 'Yetkazib berildi!',
      body: 'Buyurtmangiz muvaffaqiyatli yetkazib berildi. Sharh yozishni unutmang!',
    },
    {
      user: buyers[1],
      type: NotificationType.PROMO,
      title: 'Siz uchun taklif',
      body: "MacBook Pro siz ko'rgan mahsulot. Hozir 5% chegirma!",
    },
    {
      user: buyers[2],
      type: NotificationType.ORDER_STATUS,
      title: 'Buyurtma bekor qilindi',
      body: "ORD-2026-013 sizning iltimosga ko'ra bekor qilindi.",
    },
  ];

  for (const n of notifs) {
    await notifRepo.save(
      notifRepo.create({
        userId: n.user.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: Math.random() > 0.5,
      }),
    );
  }
  console.log(`   ✓ ${notifs.length} ta bildirishnoma yaratildi`);

  // ── YAKUNIY HISOBOT ────────────────────────────────────────────────────────
  console.log('\n✅  Seed muvaffaqiyatli yakunlandi!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log("  DEMO HISOBLAR (faqat ko'rish rejimi)");
  console.log('───────────────────────────────────────────────────────');
  console.log(`  👑 Admin  : demo.admin@karvon.uz  / ${DEMO_PASS}`);
  console.log(`  🏪 Seller : demo.seller@karvon.uz / ${DEMO_PASS}`);
  console.log(`  👤 Buyer  : demo.user@karvon.uz   / ${DEMO_PASS}`);
  console.log('───────────────────────────────────────────────────────');
  console.log('  REAL HISOBLAR');
  console.log('───────────────────────────────────────────────────────');
  console.log(`  👑 Admin  : admin@karvon.uz        / ${REAL_PASS}`);
  console.log(`  🏪 TechZone: techzone@karvon.uz    / ${REAL_PASS}`);
  console.log(`  🏪 FashionHub: fashionhub@karvon.uz/ ${REAL_PASS}`);
  console.log(`  🏪 HomeStyle: homestyle@karvon.uz  / ${REAL_PASS}`);
  console.log(`  🚚 Kuryer : courier@karvon.uz      / ${REAL_PASS}`);
  console.log('───────────────────────────────────────────────────────');
  console.log('  FAOL KUPONLAR');
  console.log('───────────────────────────────────────────────────────');
  console.log('  WELCOME10  — 10% chegirma (cheksiz)');
  console.log('  SUMMER25   — 25% chegirma (min 500K, max 300K)');
  console.log("  TECH50K    — 50,000 so'm chegirma (min 300K)");
  console.log("  VIP500K    — 500,000 so'm chegirma (min 5M)");
  console.log('═══════════════════════════════════════════════════════\n');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed xatosi:', err);
  process.exit(1);
});
