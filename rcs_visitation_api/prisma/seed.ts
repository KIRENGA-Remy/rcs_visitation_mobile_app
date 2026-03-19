import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding RCS Visitation database...');

  // ── Create Prisons ────────────────────────────────────────
  const kgl = await prisma.prison.upsert({
    where: { code: 'KGL-1930' },
    update: {},
    create: {
      name: 'Kigali 1930 Prison', code: 'KGL-1930',
      district: 'Nyarugenge', sector: 'Nyamirambo', address: 'KG 7 Ave, Kigali',
      latitude: -1.9441, longitude: 30.0619,
      capacity: 2000, maxVisitorsPerSlot: 30, visitDurationMinutes: 30,
      visitingDaysConfig: { mon: true, tue: false, wed: true, thu: false, fri: true, sat: true, sun: false },
    },
  });

  const musanze = await prisma.prison.upsert({
    where: { code: 'MSZ-PRISON' },
    update: {},
    create: {
      name: 'Musanze Prison', code: 'MSZ-PRISON',
      district: 'Musanze', address: 'Musanze, Northern Province',
      capacity: 800, maxVisitorsPerSlot: 15, visitDurationMinutes: 30,
    },
  });

  console.log('✅ Prisons created:', kgl.name, musanze.name);

  // ── Create Admin User ─────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rcs.gov.rw' },
    update: {},
    create: {
      email: 'admin@rcs.gov.rw', phone: '+250788000001',
      passwordHash: adminHash, role: 'ADMIN',
      firstName: 'System', lastName: 'Administrator',
    },
  });

  // ── Create Prison Officer ─────────────────────────────────
  const officerHash = await bcrypt.hash('Officer@1234', 12);
  const officer = await prisma.user.upsert({
    where: { email: 'officer@kgl1930.rcs.gov.rw' },
    update: {},
    create: {
      email: 'officer@kgl1930.rcs.gov.rw', phone: '+250788000002',
      passwordHash: officerHash, role: 'PRISON_OFFICER',
      firstName: 'Jean', lastName: 'Mugisha',
    },
  });

  // ── Create Visitor ────────────────────────────────────────
  const visitorHash = await bcrypt.hash('Visitor@1234', 12);
  const visitor = await prisma.user.upsert({
    where: { email: 'amina.uwase@example.rw' },
    update: {},
    create: {
      email: 'amina.uwase@example.rw', phone: '+250788000003',
      passwordHash: visitorHash, role: 'VISITOR',
      firstName: 'Amina', lastName: 'Uwase',
      nationalId: '1199780012345678', gender: 'FEMALE',
      visitorProfile: {
        create: { district: 'Gasabo', sector: 'Remera' }
      },
    },
  });

  console.log('✅ Users created:', admin.email, officer.email, visitor.email);

  // ── Create Prisoner ───────────────────────────────────────
  const prisoner = await prisma.prisoner.upsert({
    where: { prisonerNumber: 'KGL-2023-001' },
    update: {},
    create: {
      prisonId: kgl.id, prisonerNumber: 'KGL-2023-001',
      firstName: 'John', lastName: 'Doe',
      gender: 'MALE', admissionDate: new Date('2023-01-15'),
      cellBlock: 'Block A', cellNumber: 'A-12',
    },
  });

  console.log('✅ Prisoner created:', prisoner.prisonerNumber);

  // ── Create Visit Schedule ─────────────────────────────────
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const slotStart = new Date(tomorrow); slotStart.setHours(9, 0, 0, 0);
  const slotEnd   = new Date(tomorrow); slotEnd.setHours(12, 0, 0, 0);

  await prisma.visitSchedule.create({
    data: {
      prisonId: kgl.id,
      date: tomorrow,
      startTime: slotStart, endTime: slotEnd,
      label: 'Morning Session',
      maxCapacity: 30, visitType: 'REGULAR',
      createdByUserId: admin.id,
    },
  });

  console.log('✅ Visit schedule created');
  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Test Credentials:');
  console.log('  Admin   : admin@rcs.gov.rw         / Admin@1234');
  console.log('  Officer : officer@kgl1930.rcs.gov.rw / Officer@1234');
  console.log('  Visitor : amina.uwase@example.rw   / Visitor@1234');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
