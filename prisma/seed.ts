import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateAccountNumber } from '../src/lib/account-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users with extended profile data
  const adminUser = await prisma.user.create({
    data: {
      name: 'Max Administrator',
      email: 'admin@onlinekonto.de',
      password: await bcrypt.hash('admin123', 12),
      role: 'ADMIN',
      accountNumber: generateAccountNumber(),
      kycStatus: 'VERIFIED',
      street: 'Musterstraße 123',
      postalCode: '10115',
      city: 'Berlin',
      country: 'Deutschland',
      referenceIban: 'DE89370400440532013000',
      referenceBic: 'COBADEFFXXX',
      referenceBankName: 'Commerzbank AG',
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      name: 'Anna Beispiel',
      email: 'user@onlinekonto.de',
      password: await bcrypt.hash('user123', 12),
      role: 'USER',
      accountNumber: generateAccountNumber(),
      kycStatus: 'VERIFIED',
      street: 'Beispielweg 456',
      postalCode: '80331',
      city: 'München',
      country: 'Deutschland',
      referenceIban: 'DE12345678901234567890',
      referenceBic: 'BYLADEM1001',
      referenceBankName: 'Bayerische Landesbank',
    },
  });

  // Create additional demo user with different KYC status
  const pendingUser = await prisma.user.create({
    data: {
      name: 'Thomas Müller',
      email: 'thomas@onlinekonto.de',
      password: await bcrypt.hash('demo123', 12),
      role: 'USER',
      accountNumber: generateAccountNumber(),
      kycStatus: 'PENDING',
      street: 'Hauptstraße 789',
      postalCode: '20095',
      city: 'Hamburg',
      country: 'Deutschland',
      // No reference account yet (KYC pending)
    },
  });

  console.log('✅ Users created');

  // Create demo anlagen
  const anlage1 = await prisma.festgeldAnlage.create({
    data: {
      userId: regularUser.id,
      betrag: 10000,
      zinssatz: 3.5,
      laufzeitMonate: 12,
      startDatum: new Date('2024-01-15'),
      endDatum: new Date('2025-01-15'),
      zinsbetrag: 350,
      endbetrag: 10350,
      status: 'AKTIV',
    },
  });

  const anlage2 = await prisma.festgeldAnlage.create({
    data: {
      userId: regularUser.id,
      betrag: 5000,
      zinssatz: 4.2,
      laufzeitMonate: 24,
      startDatum: new Date('2024-03-01'),
      endDatum: new Date('2026-03-01'),
      zinsbetrag: 420,
      endbetrag: 5420,
      status: 'AKTIV',
    },
  });

  const anlage3 = await prisma.festgeldAnlage.create({
    data: {
      userId: regularUser.id,
      betrag: 19992,
      zinssatz: 12.0,
      laufzeitMonate: 24,
      startDatum: new Date('2025-03-14'),
      endDatum: new Date('2027-03-14'),
      zinsbetrag: 4798.08,
      endbetrag: 24790.08,
      status: 'VORZEITIG_BEENDET',
    },
  });

  console.log('✅ Anlagen created');

  // Create demo transactions
  await prisma.transaktion.create({
    data: {
      anlageId: anlage1.id,
      userId: regularUser.id,
      typ: 'EINZAHLUNG',
      betrag: 10000,
      datum: new Date('2024-01-15T10:00:00Z'),
      beschreibung: 'Einzahlung für Festgeldanlage #1',
    },
  });

  await prisma.transaktion.create({
    data: {
      anlageId: anlage2.id,
      userId: regularUser.id,
      typ: 'EINZAHLUNG',
      betrag: 5000,
      datum: new Date('2024-03-01T10:00:00Z'),
      beschreibung: 'Einzahlung für Festgeldanlage #2',
    },
  });

  await prisma.transaktion.create({
    data: {
      anlageId: anlage3.id,
      userId: regularUser.id,
      typ: 'EINZAHLUNG',
      betrag: 19992,
      datum: new Date('2025-03-14T00:43:45Z'),
      beschreibung: 'Einzahlung für Festgeldanlage #3',
    },
  });

  await prisma.transaktion.create({
    data: {
      anlageId: anlage3.id,
      userId: regularUser.id,
      typ: 'ZINSGUTSCHRIFT',
      betrag: 0,
      datum: new Date('2025-03-14T00:45:42Z'),
      beschreibung: 'Reduzierte Zinsen für vorzeitig beendete Festgeldanlage #3',
    },
  });

  await prisma.transaktion.create({
    data: {
      anlageId: anlage3.id,
      userId: regularUser.id,
      typ: 'AUSZAHLUNG',
      betrag: 19992,
      datum: new Date('2025-03-14T00:45:42Z'),
      beschreibung: 'Auszahlung der vorzeitig beendeten Festgeldanlage #3',
    },
  });

  await prisma.transaktion.create({
    data: {
      userId: regularUser.id,
      typ: 'ZINSGUTSCHRIFT',
      betrag: 29.17,
      datum: new Date('2024-02-15T10:00:00Z'),
      beschreibung: 'Monatliche Zinsgutschrift für Januar 2024',
    },
  });

  console.log('✅ Transaktionen created');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('👨‍💼 Admin: admin@onlinekonto.de / admin123');
  console.log('👤 User: user@onlinekonto.de / user123');
  console.log('👤 Pending KYC: thomas@onlinekonto.de / demo123');
  console.log('\n📊 Account Numbers:');
  console.log(`Admin: ${adminUser.accountNumber}`);
  console.log(`User: ${regularUser.accountNumber}`);
  console.log(`Pending: ${pendingUser.accountNumber}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
