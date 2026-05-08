import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../../database/entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginated } from '../../common/utils/paginate';
import { PaginatedResult } from '../../common/interfaces/paginated.interface';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon) private readonly couponRepo: Repository<Coupon>,
  ) {}

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const code = dto.code.toUpperCase().trim();
    const existing = await this.couponRepo.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`"${code}" kupon kodi allaqachon mavjud`);
    }

    return this.couponRepo.save(
      this.couponRepo.create({
        code,
        type: dto.type,
        value: String(dto.value),
        minOrderAmount:
          dto.minOrderAmount != null ? String(dto.minOrderAmount) : null,
        maxDiscountAmount:
          dto.maxDiscountAmount != null ? String(dto.maxDiscountAmount) : null,
        usageLimit: dto.usageLimit ?? null,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findByIdOrFail(id);

    if (dto.code && dto.code.toUpperCase().trim() !== coupon.code) {
      const existing = await this.couponRepo.findOne({
        where: { code: dto.code.toUpperCase().trim() },
      });
      if (existing) {
        throw new ConflictException(
          `"${dto.code.toUpperCase()}" kupon kodi allaqachon mavjud`,
        );
      }
      coupon.code = dto.code.toUpperCase().trim();
    }

    if (dto.type !== undefined) coupon.type = dto.type;
    if (dto.value !== undefined) coupon.value = String(dto.value);
    if (dto.minOrderAmount !== undefined)
      coupon.minOrderAmount =
        dto.minOrderAmount != null ? String(dto.minOrderAmount) : null;
    if (dto.maxDiscountAmount !== undefined)
      coupon.maxDiscountAmount =
        dto.maxDiscountAmount != null ? String(dto.maxDiscountAmount) : null;
    if (dto.usageLimit !== undefined)
      coupon.usageLimit = dto.usageLimit ?? null;
    if (dto.validFrom !== undefined)
      coupon.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    if (dto.validUntil !== undefined)
      coupon.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    if (dto.isActive !== undefined) coupon.isActive = dto.isActive;

    return this.couponRepo.save(coupon);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Coupon>> {
    const [items, total] = await this.couponRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return buildPaginated(items, total, query.page, query.limit);
  }

  async findByIdOrFail(id: string): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('Kupon topilmadi');
    return coupon;
  }

  async validateCode(code: string) {
    const coupon = await this.couponRepo.findOne({
      where: { code: code.toUpperCase().trim(), isActive: true },
    });
    if (!coupon) {
      throw new NotFoundException('Kupon topilmadi yoki noaktiv');
    }

    const now = new Date();
    const isValid =
      (!coupon.validFrom || new Date(coupon.validFrom) <= now) &&
      (!coupon.validUntil || new Date(coupon.validUntil) >= now) &&
      (coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit);

    return {
      valid: isValid,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
      },
      reason: !isValid
        ? coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit
          ? 'Kupon limiti tugagan'
          : "Kupon muddati o'tgan yoki hali boshlanmagan"
        : undefined,
    };
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.findByIdOrFail(id);
    if (coupon.usageCount > 0) {
      // Ishlatilgan kuponni o'chirmasdan, deactivate qilamiz
      coupon.isActive = false;
      await this.couponRepo.save(coupon);
      return;
    }
    await this.couponRepo.remove(coupon);
  }
}
