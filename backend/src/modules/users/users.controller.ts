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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../database/entities/enums';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  // ───────── ADMIN ─────────

  @Get()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Foydalanuvchilar ro'yxati (admin)" })
  list(@Query() query: UsersQueryDto) {
    return this.usersService.list(query);
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
