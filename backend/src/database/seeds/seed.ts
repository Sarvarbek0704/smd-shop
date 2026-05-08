import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { RoleName } from '../entities/enums';

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Seed boshlandi...');

  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getTreeRepository(Category);

  // 1. Rollar
  const roleData: { name: RoleName; description: string }[] = [
    { name: RoleName.ADMIN, description: 'Tizim administratori' },
    { name: RoleName.SELLER, description: 'Sotuvchi' },
    { name: RoleName.BUYER, description: 'Xaridor' },
    { name: RoleName.DELIVERY, description: 'Kuryer' },
  ];

  for (const r of roleData) {
    const exists = await roleRepo.findOne({ where: { name: r.name } });
    if (!exists) {
      await roleRepo.save(roleRepo.create(r));
      console.log(`  ✓ Rol yaratildi: ${r.name}`);
    }
  }

  // 2. Admin foydalanuvchi
  const adminEmail = 'admin@shop.local';
  let admin = await userRepo.findOne({
    where: { email: adminEmail },
    relations: ['roles'],
  });

  if (!admin) {
    const adminRole = await roleRepo.findOneByOrFail({ name: RoleName.ADMIN });
    admin = userRepo.create({
      email: adminEmail,
      passwordHash: await bcrypt.hash('Admin12345!', 10),
      firstName: 'Admin',
      lastName: 'User',
      isVerified: true,
      isActive: true,
      roles: [adminRole],
    });
    await userRepo.save(admin);
    console.log(`  ✓ Admin yaratildi: ${adminEmail} / Admin12345!`);
  }

  // 3. Birlamchi kategoriyalar (2 daraja)
  const baseCategories = [
    {
      name: 'Elektronika',
      slug: 'elektronika',
      children: [
        { name: 'Smartfonlar', slug: 'smartfonlar' },
        { name: 'Noutbuklar', slug: 'noutbuklar' },
        { name: 'Aksessuarlar', slug: 'aksessuarlar' },
      ],
    },
    {
      name: 'Kiyim',
      slug: 'kiyim',
      children: [
        { name: 'Erkaklar uchun', slug: 'erkaklar-uchun' },
        { name: 'Ayollar uchun', slug: 'ayollar-uchun' },
        { name: 'Bolalar uchun', slug: 'bolalar-uchun' },
      ],
    },
    {
      name: "Uy va bog'",
      slug: 'uy-va-bog',
      children: [
        { name: 'Mebel', slug: 'mebel' },
        { name: 'Oshxona buyumlari', slug: 'oshxona-buyumlari' },
      ],
    },
  ];

  for (const cat of baseCategories) {
    let parent = await categoryRepo.findOne({ where: { slug: cat.slug } });
    if (!parent) {
      parent = await categoryRepo.save(
        categoryRepo.create({ name: cat.name, slug: cat.slug, isActive: true }),
      );
      console.log(`  ✓ Kategoriya: ${cat.name}`);
    }
    for (const child of cat.children) {
      const exists = await categoryRepo.findOne({
        where: { slug: child.slug },
      });
      if (!exists) {
        await categoryRepo.save(
          categoryRepo.create({
            name: child.name,
            slug: child.slug,
            parent,
            isActive: true,
          }),
        );
        console.log(`    ✓ Sub-kategoriya: ${child.name}`);
      }
    }
  }

  console.log('✅ Seed yakunlandi.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed xatosi:', err);
  process.exit(1);
});
