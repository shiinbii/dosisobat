import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

type DrugSeed = {
  name: string;
  brandNames?: string;
  category: string;
  routes: string;
  composition?: string;
  indication?: string;
  contraindication?: string;
  sideEffects?: string;
  warning?: string;
  pediMgPerKgDose?: number;
  pediMgPerKgDay?: number;
  pediMaxPerDose?: number;
  pediMaxPerDay?: number;
  pediFreqPerDay?: number;
  pediMinAgeMonths?: number;
  pediNotes?: string;
  adultDoseMin?: number;
  adultDoseMax?: number;
  adultMaxPerDay?: number;
  adultFreqPerDay?: number;
  adultNotes?: string;
  forms: Array<{
    type: string;
    strength: string;
    amountMg?: number;
    perMl?: number;
    packaging?: string;
  }>;
};

type Icd10Seed = {
  code: string;
  description: string;
  descriptionId?: string;
  category?: string;
};

async function seedDrugs() {
  const raw = readFileSync(resolve(__dirname, 'data/drugs.json'), 'utf-8');
  const drugs: DrugSeed[] = JSON.parse(raw);

  console.log(`📦 Seeding ${drugs.length} drugs...`);

  for (const d of drugs) {
    const { forms, ...drugFields } = d;
    const nameLower = d.name.toLowerCase().trim();

    await prisma.drug.upsert({
      where: { nameLower },
      create: {
        ...drugFields,
        nameLower,
        brandNames: d.brandNames ?? '',
        forms: { create: forms },
      },
      update: {
        ...drugFields,
        brandNames: d.brandNames ?? '',
        forms: {
          deleteMany: {},
          create: forms,
        },
      },
    });
  }

  console.log(`✅ Drugs seeded.`);
}

async function seedIcd10() {
  const raw = readFileSync(resolve(__dirname, 'data/icd10.json'), 'utf-8');
  const codes: Icd10Seed[] = JSON.parse(raw);

  console.log(`📦 Seeding ${codes.length} ICD-10 codes...`);

  for (const c of codes) {
    await prisma.icd10.upsert({
      where: { code: c.code },
      create: c,
      update: c,
    });
  }

  console.log(`✅ ICD-10 seeded.`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@dosis.app';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123';
  const name = process.env.ADMIN_NAME ?? 'Default Admin';

  const hash = await bcrypt.hash(password, 10);

  await prisma.adminUser.upsert({
    where: { email },
    create: { email, password: hash, name },
    update: { password: hash, name },
  });

  console.log(`✅ Admin user ready: ${email}`);
}

async function main() {
  await seedDrugs();
  await seedIcd10();
  await seedAdmin();
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
