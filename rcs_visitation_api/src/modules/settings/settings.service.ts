import { prisma } from '../../config/prisma';
import { UpsertSettingDto, BulkUpsertDto } from './settings.schema';

export class SettingsService {

  async getForPrison(prisonId: string) {
    // Return both global settings AND prison-specific overrides merged
    const [global, specific] = await Promise.all([
      prisma.settings.findMany({ where: { scope: 'GLOBAL' } }),
      prisma.settings.findMany({ where: { scope: prisonId } }),
    ]);

    // Prison-specific overrides global
    const merged: Record<string, any> = {};
    global.forEach(s => { merged[s.key] = { value: s.value, description: s.description, scope: 'GLOBAL' }; });
    specific.forEach(s => { merged[s.key] = { value: s.value, description: s.description, scope: 'PRISON' }; });

    return merged;
  }

  async getGlobal() {
    const settings = await prisma.settings.findMany({ where: { scope: 'GLOBAL' }, orderBy: { key: 'asc' } });
    return settings;
  }

  async upsertForPrison(prisonId: string, dto: UpsertSettingDto, updatedBy: string) {
    // Verify prison exists
    await prisma.prison.findUniqueOrThrow({ where: { id: prisonId } });

    return prisma.settings.upsert({
      where:  { scope_key: { scope: prisonId, key: dto.key } },
      update: { value: dto.value, description: dto.description, updatedBy },
      create: { scope: prisonId, key: dto.key, value: dto.value, description: dto.description, updatedBy },
    });
  }

  async upsertGlobal(dto: UpsertSettingDto, updatedBy: string) {
    return prisma.settings.upsert({
      where:  { scope_key: { scope: 'GLOBAL', key: dto.key } },
      update: { value: dto.value, description: dto.description, updatedBy },
      create: { scope: 'GLOBAL', key: dto.key, value: dto.value, description: dto.description, updatedBy },
    });
  }

  async bulkUpsertForPrison(prisonId: string, dto: BulkUpsertDto, updatedBy: string) {
    await prisma.prison.findUniqueOrThrow({ where: { id: prisonId } });

    const results = await Promise.all(
      dto.settings.map(s =>
        prisma.settings.upsert({
          where:  { scope_key: { scope: prisonId, key: s.key } },
          update: { value: s.value, description: s.description, updatedBy },
          create: { scope: prisonId, key: s.key, value: s.value, description: s.description, updatedBy },
        })
      )
    );
    return { updated: results.length, settings: results };
  }

  async deleteForPrison(prisonId: string, key: string) {
    return prisma.settings.delete({ where: { scope_key: { scope: prisonId, key } } });
  }
}

export const settingsService = new SettingsService();
