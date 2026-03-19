/**
 * Unit Tests: SettingsService
 * Tests: global defaults, per-prison overrides, merge logic, bulk upsert
 */
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS      = '1';

import { prismaMock } from '../../helpers/prisma.mock';
jest.mock('../../../config/prisma', () => ({ prisma: prismaMock }));

import { SettingsService } from '../../../modules/settings/settings.service';
import { TEST_IDS } from '../../helpers/auth.helper';

const svc = new SettingsService();

const globalSetting  = (key: string, value: string) => ({ id: `g-${key}`, scope: 'GLOBAL', key, value, description: null, updatedAt: new Date(), updatedBy: null });
const prisonSetting  = (key: string, value: string) => ({ id: `p-${key}`, scope: TEST_IDS.prison, key, value, description: null, updatedAt: new Date(), updatedBy: null });

describe('SettingsService.getForPrison — merge logic', () => {
  it('returns global defaults when no prison overrides exist', async () => {
    prismaMock.settings.findMany
      .mockResolvedValueOnce([globalSetting('max_visitors_per_slot', '30')] as any)
      .mockResolvedValueOnce([]); // no prison-specific settings

    const result = await svc.getForPrison(TEST_IDS.prison);
    expect(result['max_visitors_per_slot'].value).toBe('30');
    expect(result['max_visitors_per_slot'].scope).toBe('GLOBAL');
  });

  it('prison-specific setting overrides global', async () => {
    prismaMock.settings.findMany
      .mockResolvedValueOnce([globalSetting('max_visitors_per_slot', '30')] as any)  // global
      .mockResolvedValueOnce([prisonSetting('max_visitors_per_slot', '15')] as any); // prison override

    const result = await svc.getForPrison(TEST_IDS.prison);
    expect(result['max_visitors_per_slot'].value).toBe('15');
    expect(result['max_visitors_per_slot'].scope).toBe('PRISON');
  });

  it('merges multiple keys correctly', async () => {
    prismaMock.settings.findMany
      .mockResolvedValueOnce([
        globalSetting('max_visitors_per_slot', '30'),
        globalSetting('visit_duration_minutes', '30'),
      ] as any)
      .mockResolvedValueOnce([
        prisonSetting('visit_duration_minutes', '20'), // only this one overridden
      ] as any);

    const result = await svc.getForPrison(TEST_IDS.prison);
    expect(result['max_visitors_per_slot'].scope).toBe('GLOBAL');   // not overridden
    expect(result['visit_duration_minutes'].scope).toBe('PRISON');  // overridden
    expect(result['visit_duration_minutes'].value).toBe('20');
  });
});

describe('SettingsService.bulkUpsertForPrison', () => {
  it('upserts multiple settings atomically', async () => {
    prismaMock.prison.findUniqueOrThrow.mockResolvedValue({ id: TEST_IDS.prison } as any);
    prismaMock.settings.upsert.mockResolvedValue(prisonSetting('key1', 'val1') as any);

    const result = await svc.bulkUpsertForPrison(TEST_IDS.prison, {
      settings: [
        { key: 'max_visitors_per_slot', value: '20' },
        { key: 'visit_duration_minutes', value: '25' },
      ],
    }, TEST_IDS.admin);

    expect(prismaMock.settings.upsert).toHaveBeenCalledTimes(2);
    expect(result.updated).toBe(2);
  });

  it('throws when prison does not exist', async () => {
    prismaMock.prison.findUniqueOrThrow.mockRejectedValue(new Error('Record not found'));
    await expect(svc.bulkUpsertForPrison('invalid-id', {
      settings: [{ key: 'x', value: 'y' }],
    }, TEST_IDS.admin)).rejects.toThrow();
  });
});
