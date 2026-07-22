import { PrismaClient } from '@prisma/client';
import { env } from '../src/config/env'
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding RCS Visitation database...');

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

  // ── Create Admin User ─────────────────────────────────────
  const adminHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: 'gitoliremy@gmail.com' },
    update: {},
    create: {
      email: 'gitoliremy@gmail.com', phone: '+250792441050',
      passwordHash: adminHash, role: 'ADMIN',
      firstName: 'System', lastName: 'Administrator',
    },
  });

  // ── Create Prison Officer ─────────────────────────────────
  const officerHash = await bcrypt.hash(env.OFFICER_PASSWORD, 12);
  const officer = await prisma.user.upsert({
    where: { email: 'gitoliremyclaudien5@gmail.com' },
    update: {},
    create: {
      email: 'gitoliremyclaudien5@gmail.com', phone: '+250732839149',
      passwordHash: officerHash, role: 'PRISON_OFFICER',
      firstName: 'Kirenga', lastName: 'Remy',
    },
  });

  // ── Create Visitor ────────────────────────────────────────
  const visitorHash = await bcrypt.hash(env.VISITOR_PASSWORD, 12);
  const visitor = await prisma.user.upsert({
    where: { email: 'gitoliremyclaudien2005@gmail.com' },
    update: {},
    create: {
      email: 'gitoliremyclaudien2005@gmail.com', phone: '+250786146982',
      passwordHash: visitorHash, role: 'VISITOR',
      firstName: 'GITORI', lastName: 'Remy',
      nationalId: '1200580024050004', gender: 'MALE',
      visitorProfile: {
        create: { district: 'Gasabo', sector: 'Remera' }
      },
    },
  });

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
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
