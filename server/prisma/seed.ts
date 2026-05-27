import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const D = (n: number) => new Prisma.Decimal(n);

async function main() {
  console.log('Seeding initial data...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@sofiashop.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'Admin Sofia',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: 'ADMIN',
      },
    });
    console.log(`  ✓ Created admin user: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`  • Admin user already exists: ${adminEmail}`);
  }

  // Categories
  const categories = [
    { name: 'Pakaian', slug: 'pakaian' },
    { name: 'Aksesoris', slug: 'aksesoris' },
    { name: 'Tas & Dompet', slug: 'tas-dompet' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: {},
    });
  }
  console.log(`  ✓ Seeded ${categories.length} categories`);

  // Sample products (only if catalog is empty)
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const pakaian = await prisma.category.findUnique({ where: { slug: 'pakaian' } });
    const aksesoris = await prisma.category.findUnique({ where: { slug: 'aksesoris' } });
    await prisma.product.createMany({
      data: [
        {
          name: 'Kaos Polos Premium',
          sku: 'KP-001',
          price: D(75000),
          costPrice: D(45000),
          stock: 50,
          minStock: 10,
          categoryId: pakaian?.id ?? null,
        },
        {
          name: 'Kemeja Lengan Panjang',
          sku: 'KLP-002',
          price: D(150000),
          costPrice: D(90000),
          stock: 30,
          minStock: 5,
          categoryId: pakaian?.id ?? null,
        },
        {
          name: 'Topi Baseball',
          sku: 'TB-003',
          price: D(60000),
          costPrice: D(30000),
          stock: 25,
          minStock: 5,
          categoryId: aksesoris?.id ?? null,
        },
      ],
    });
    console.log('  ✓ Seeded 3 sample products');
  } else {
    console.log(`  • ${productCount} products already present, skipping product seed`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
