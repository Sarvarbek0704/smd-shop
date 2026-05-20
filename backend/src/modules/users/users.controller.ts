import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../database/entities/enums';
import { StorageService } from '../uploads/storage.service';
import { FileValidationPipe } from '../uploads/pipes/file-validation.pipe';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  // ───────── Foydalanuvchining o'zi ─────────

  @Get('me')
  @ApiOperation({ summary: 'Joriy foydalanuvchi profili' })
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Profilni yangilash' })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Parolni o'zgartirish" })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(user.id, dto);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Avatar yuklash' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
  ) {
    const stored = await this.storageService.saveImage(file.buffer, 'avatars');
    await this.usersService.updateProfile(user.id, { avatarUrl: stored.path });
    return { avatarUrl: stored.path };
  }

  @Post('me/apply-seller')
  @ApiOperation({ summary: 'Sotuvchi bo\'lish uchun ariza yuborish' })
  applyToBeSeller(
    @CurrentUser() user: AuthUser,
    @Body() dto: { storeName: string; storeDescription: string },
  ) {
    return this.usersService.applyToBeSeller(user.id, dto);
  }

  // ───────── ADMIN ─────────

  @Get()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Foydalanuvchilar ro'yxati (admin)" })
  list(@Query() query: UsersQueryDto) {
    return this.usersService.list(query);
  }

  @Get('sellers')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Sotuvchi arizachilari ro'yxati (admin)" })
  listSellers(@Query() query: UsersQueryDto) {
    return this.usersService.listSellers(query);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Foydalanuvchi profili (admin)' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getProfile(id);
  }

  @Post(':id/roles')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Rol berish' })
  assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.usersService.assignRole(id, dto.role);
  }

  @Delete(':id/roles/:role')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Rolni olib tashlash' })
  removeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('role') role: RoleName,
  ) {
    return this.usersService.removeRole(id, role);
  }

  @Post(':id/approve-seller')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Sotuvchi arizasini tasdiqlash' })
  approveSeller(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.approveSeller(id);
  }

  @Post(':id/reject-seller')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Sotuvchi arizasini rad etish' })
  rejectSeller(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { reason: string },
  ) {
    return this.usersService.rejectSeller(id, dto.reason);
  }

  @Patch(':id/activate')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Akkountni faollashtirish' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.setActive(id, true);
  }

  @Patch(':id/deactivate')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Akkountni bloklash' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.setActive(id, false);
  }
}
