import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cart } from '../../database/entities/cart.entity';
import { CartItem } from '../../database/entities/cart-item.entity';
import { Product } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { Coupon } from '../../database/entities/coupon.entity';
import { CouponType, ProductStatus } from '../../database/entities/enums';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
    private readonly dataSource: DataSource,
  ) {}

  // ───────────────── GET CART ─────────────────

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const items = await this.cartItemRepo.find({
      where: { cartId: cart.id },
      relations: ['product', 'product.images', 'variant'],
      order: { addedAt: 'DESC' },
    });

    // Har bir item uchun hisoblangan narx
    const enrichedItems = items.map((item) => {
      const basePrice = parseFloat(item.product.basePrice);
      const discountPrice = item.product.discountPrice
        ? parseFloat(item.product.discountPrice)
        : null;

      // Chegirma muddatini tekshirish
      const isDiscountActive =
        discountPrice !== null &&
        (!item.product.discountEndsAt ||
          new Date(item.product.discountEndsAt) > new Date());

      const effectivePrice = isDiscountActive ? discountPrice! : basePrice;

      // Variant narx modifier'i
      const variantModifier = item.variant
        ? parseFloat(item.variant.priceModifier)
        : 0;

      const unitPrice = effectivePrice + variantModifier;
      const totalPrice = unitPrice * item.quantity;

      // Asosiy rasm
      const primaryImage = item.product.images?.find((img) => img.isPrimary);

      return {
        id: item.id,
        quantity: item.quantity,
        addedAt: item.addedAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          status: item.product.status,
          image: primaryImage?.url ?? item.product.images?.[0]?.url ?? null,
        },
        variant: item.variant
          ? {
              id: item.variant.id,
              name: item.variant.name,
              sku: item.variant.sku,
              stockQuantity: item.variant.stockQuantity,
              isActive: item.variant.isActive,
            }
          : null,
        pricing: {
          basePrice,
          discountPrice: isDiscountActive ? discountPrice : null,
          variantModifier,
          unitPrice,
          totalPrice,
        },
      };
    });

    // Umumiy hisob
    const totalItems = enrichedItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = enrichedItems.reduce(
      (sum, i) => sum + i.pricing.totalPrice,
      0,
    );

    // Muammoli mahsulotlar (noaktiv, zaxirasi yo'q)
    const warnings: string[] = [];
    for (const item of enrichedItems) {
      if (item.product.status !== ProductStatus.ACTIVE) {
        warnings.push(`"${item.product.name}" hozirda sotuvda emas`);
      }
      if (item.variant && !item.variant.isActive) {
        warnings.push(
          `"${item.product.name}" — "${item.variant.name}" varianti noaktiv`,
        );
      }
      if (item.variant && item.variant.stockQuantity < item.quantity) {
        warnings.push(
          `"${item.product.name}" — "${item.variant.name}": faqat ${item.variant.stockQuantity} ta qolgan`,
        );
      }
    }

    const subtotal = totalAmount;

    // Kupon chegirmasi (preview)
    let discountAmount = 0;
    let couponMeta: Coupon | null = null;
    if (cart.couponCode) {
      couponMeta = await this.couponRepo.findOne({
        where: { code: cart.couponCode, isActive: true },
      });
      if (couponMeta) {
        const meetsMin =
          !couponMeta.minOrderAmount ||
          subtotal >= parseFloat(couponMeta.minOrderAmount);
        if (meetsMin) {
          if (couponMeta.type === CouponType.PERCENTAGE) {
            discountAmount = subtotal * (parseFloat(couponMeta.value) / 100);
          } else {
            discountAmount = parseFloat(couponMeta.value);
          }
          if (couponMeta.maxDiscountAmount) {
            discountAmount = Math.min(
              discountAmount,
              parseFloat(couponMeta.maxDiscountAmount),
            );
          }
          discountAmount = Math.round(discountAmount);
        }
      } else {
        // Kupon endi yaroqsiz — avtomatik olib tashlash
        await this.cartRepo.update(cart.id, { couponCode: null });
      }
    }

    return {
      id: cart.id,
      items: enrichedItems,
      summary: {
        totalItems,
        subtotal,
        discountAmount,
        totalAmount: Math.max(0, subtotal - discountAmount),
        itemCount: enrichedItems.length,
        couponCode: couponMeta ? cart.couponCode : null,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // ───────────────── ADD ITEM ─────────────────

  async addItem(userId: string, dto: AddToCartDto) {
    // Mahsulot tekshiruvi
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
      relations: ['variants'],
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }
    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Bu mahsulot hozirda sotuvda emas');
    }

    // O'z mahsulotini savatga qo'sha olmaydi
    if (product.sellerId === userId) {
      throw new BadRequestException(
        "O'z mahsulotingizni savatga qo'sha olmaysiz",
      );
    }

    // Variant tekshiruvi
    let variant: ProductVariant | null = null;
    if (dto.variantId) {
      variant = await this.variantRepo.findOne({
        where: { id: dto.variantId, productId: dto.productId },
      });
      if (!variant) {
        throw new NotFoundException('Variant topilmadi');
      }
      if (!variant.isActive) {
        throw new BadRequestException('Bu variant hozirda mavjud emas');
      }
    }

    // Agar mahsulotda variantlar bo'lsa lekin variant tanlanmagan
    if (product.variants.length > 0 && !dto.variantId) {
      throw new BadRequestException('Bu mahsulot uchun variant tanlash shart');
    }

    const quantity = dto.quantity ?? 1;

    // Zaxira tekshiruvi
    if (variant && variant.stockQuantity < quantity) {
      throw new BadRequestException(
        `Zaxirada faqat ${variant.stockQuantity} ta mavjud`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    // Bir xil mahsulot+variant allaqachon savatda bormi?
    const existing = await this.cartItemRepo.findOne({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId ?? undefined,
      },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (variant && variant.stockQuantity < newQty) {
        throw new BadRequestException(
          `Zaxirada faqat ${variant.stockQuantity} ta mavjud (savatda ${existing.quantity} ta bor)`,
        );
      }
      existing.quantity = newQty;
      await this.cartItemRepo.save(existing);
    } else {
      await this.cartItemRepo.save(
        this.cartItemRepo.create({
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId ?? null,
          quantity,
        }),
      );
    }

    return this.getCart(userId);
  }

  // ───────────────── UPDATE QUANTITY ─────────────────

  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.cartItemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
      relations: ['variant'],
    });
    if (!item) {
      throw new NotFoundException('Savat elementi topilmadi');
    }

    // Zaxira tekshiruvi
    if (item.variant && item.variant.stockQuantity < quantity) {
      throw new BadRequestException(
        `Zaxirada faqat ${item.variant.stockQuantity} ta mavjud`,
      );
    }

    item.quantity = quantity;
    await this.cartItemRepo.save(item);

    return this.getCart(userId);
  }

  // ───────────────── REMOVE ITEM ─────────────────

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.cartItemRepo.findOne({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException('Savat elementi topilmadi');
    }

    await this.cartItemRepo.remove(item);
    return this.getCart(userId);
  }

  // ───────────────── CLEAR CART ─────────────────

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepo.delete({ cartId: cart.id });
    await this.cartRepo.update(cart.id, { couponCode: null });
    return this.getCart(userId);
  }

  // ───────────────── APPLY / REMOVE COUPON ─────────────────

  async applyCoupon(userId: string, code: string) {
    if (!code || !code.trim()) {
      throw new BadRequestException('Kupon kodi kiritilmagan');
    }
    const cart = await this.getOrCreateCart(userId);
    const upperCode = code.toUpperCase().trim();

    const coupon = await this.couponRepo.findOne({
      where: { code: upperCode, isActive: true },
    });
    if (!coupon) {
      throw new BadRequestException('Kupon topilmadi yoki noaktiv');
    }

    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      throw new BadRequestException('Kupon hali amal qilmaydi');
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      throw new BadRequestException("Kupon muddati o'tgan");
    }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Kupon limiti tugagan');
    }

    await this.cartRepo.update(cart.id, { couponCode: upperCode });
    return this.getCart(userId);
  }

  async removeCoupon(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.cartRepo.update(cart.id, { couponCode: null });
    return this.getCart(userId);
  }

  // ───────────────── HELPERS ─────────────────

  /**
   * Foydalanuvchining savatini olish yoki yaratish.
   * Har bir user'da faqat bitta savat bo'ladi (OneToOne).
   */
  private async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({ where: { userId } });
    if (!cart) {
      cart = await this.cartRepo.save(this.cartRepo.create({ userId }));
    }
    return cart;
  }
}
