import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { RoleName } from '../../database/entities/enums';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { TokenService } from '../auth/token.service';
import { buildPaginated } from '../../common/utils/paginate';
import { PaginatedResult } from '../../common/interfaces/paginated.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    private readonly tokenService: TokenService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async getProfile(id: string) {
    const user = await this.findById(id);
    return this.toProfileDto(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    await this.userRepo.update(id, {
      firstName: dto.firstName ?? undefined,
      lastName: dto.lastName ?? undefined,
      avatarUrl: dto.avatarUrl ?? undefined,
    });
    return this.getProfile(id);
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id })
      .getOne();

    if (!user || !user.passwordHash) {
      throw new BadRequestException(
        "Akkountingizda parol o'rnatilmagan (OAuth orqali kirgansiz)",
      );
    }

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new BadRequestException("Joriy parol noto'g'ri");
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.update(id, { passwordHash: newHash });

    // Xavfsizlik — boshqa qurilmalarda ham logout
    await this.tokenService.revokeAllForUser(id);
  }

  // ───────────── ADMIN ─────────────

  async list(query: UsersQueryDto): Promise<PaginatedResult<unknown>> {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .orderBy('u.createdAt', 'DESC');

    if (query.search) {
      const s = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((b) => {
          b.where('LOWER(u.email) LIKE :s', { s })
            .orWhere('LOWER(u.firstName) LIKE :s', { s })
            .orWhere('LOWER(u.lastName) LIKE :s', { s })
            .orWhere('u.phone LIKE :s', { s });
        }),
      );
    }

    if (query.role) {
      qb.andWhere('r.name = :role', { role: query.role });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('u.isActive = :ia', { ia: query.isActive === 'true' });
    }

    qb.skip((query.page - 1) * query.limit).take(query.limit);
    const [items, total] = await qb.getManyAndCount();

    return buildPaginated(
      items.map((u) => this.toProfileDto(u)),
      total,
      query.page,
      query.limit,
    );
  }

  async assignRole(userId: string, roleName: RoleName) {
    const user = await this.findById(userId);
    const role = await this.roleRepo.findOneByOrFail({ name: roleName });

    if (user.roles.some((r) => r.name === roleName)) {
      throw new BadRequestException('Foydalanuvchida bu rol allaqachon mavjud');
    }

    user.roles = [...user.roles, role];
    await this.userRepo.save(user);
    return this.toProfileDto(user);
  }

  async removeRole(userId: string, roleName: RoleName) {
    const user = await this.findById(userId);

    if (roleName === RoleName.ADMIN) {
      // Oxirgi admindan rol olib tashlanmasin
      const adminCount = await this.userRepo
        .createQueryBuilder('u')
        .leftJoin('u.roles', 'r')
        .where('r.name = :name', { name: RoleName.ADMIN })
        .getCount();
      if (adminCount <= 1) {
        throw new ForbiddenException(
          "Tizimda hech bo'lmaganda 1 ta admin qolishi shart",
        );
      }
    }

    user.roles = user.roles.filter((r) => r.name !== roleName);
    await this.userRepo.save(user);
    return this.toProfileDto(user);
  }

  async setActive(userId: string, isActive: boolean) {
    const user = await this.findById(userId);
    user.isActive = isActive;
    await this.userRepo.save(user);
    if (!isActive) {
      await this.tokenService.revokeAllForUser(userId);
    }
    return this.toProfileDto(user);
  }

  // ───────────── helpers ─────────────

  private toProfileDto(user: User) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isActive: user.isActive,
      roles: (user.roles ?? []).map((r) => r.name),
      createdAt: user.createdAt,
    };
  }
}
