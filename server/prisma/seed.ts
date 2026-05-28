import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const D = (n: number) => new Prisma.Decimal(n);

async function main() {
  console.log('Seeding initial data...');

  // -------- Super admin (platform owner) --------
  const superEmail = process.env.SEED_SUPER_EMAIL ?? 'super@compos.local';
  const superPassword = process.env.SEED_SUPER_PASSWORD ?? 'SuperPass123!';

  const existingSuper = await prisma.user.findUnique({ where: { email: superEmail } });
  if (!existingSuper) {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: superEmail,
        passwordHash: await bcrypt.hash(superPassword, 10),
        role: 'SUPER_ADMIN',
        tenantId: null,
      },
    });
    console.log(`  ✓ Created super admin: ${superEmail} / ${superPassword}`);
  } else {
    console.log(`  • Super admin already exists: ${superEmail}`);
  }

  // -------- Default tenant + admin --------
  const tenantSlug = process.env.SEED_TENANT_SLUG ?? 'sofiashop';
  let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Sofia Shop',
        slug: tenantSlug,
        description:
          'Toko ritel modern di wilayah Tebas dan sekitarnya. Pesan online, ambil di toko atau dikirim ke alamat Anda.',
        whatsapp: '6281234567890',
        email: 'hello@sofiashop.com',
      },
    });
    console.log(`  ✓ Created tenant: ${tenant.name} (slug: ${tenant.slug})`);
  } else {
    console.log(`  • Tenant already exists: ${tenant.slug}`);
  }

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
        tenantId: tenant.id,
      },
    });
    console.log(`  ✓ Created tenant admin: ${adminEmail} / ${adminPassword}`);
  } else if (!existingAdmin.tenantId) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { tenantId: tenant.id },
    });
    console.log(`  ✓ Linked existing admin to tenant ${tenant.slug}`);
  } else {
    console.log(`  • Admin user already exists: ${adminEmail}`);
  }

  // -------- Categories (per tenant) --------
  const categories = [
    { name: 'Pakaian', slug: 'pakaian' },
    { name: 'Aksesoris', slug: 'aksesoris' },
    { name: 'Tas & Dompet', slug: 'tas-dompet' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: c.slug } },
      create: { ...c, tenantId: tenant.id },
      update: {},
    });
  }
  console.log(`  ✓ Seeded ${categories.length} categories`);

  // -------- Sample products (only if tenant has no products) --------
  const productCount = await prisma.product.count({ where: { tenantId: tenant.id } });
  if (productCount === 0) {
    const pakaian = await prisma.category.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: 'pakaian' } },
    });
    const aksesoris = await prisma.category.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: 'aksesoris' } },
    });
    await prisma.product.createMany({
      data: [
        {
          tenantId: tenant.id,
          name: 'Kaos Polos Premium',
          sku: 'KP-001',
          price: D(75000),
          costPrice: D(45000),
          stock: 50,
          minStock: 10,
          categoryId: pakaian?.id ?? null,
        },
        {
          tenantId: tenant.id,
          name: 'Kemeja Lengan Panjang',
          sku: 'KLP-002',
          price: D(150000),
          costPrice: D(90000),
          stock: 30,
          minStock: 5,
          categoryId: pakaian?.id ?? null,
        },
        {
          tenantId: tenant.id,
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
