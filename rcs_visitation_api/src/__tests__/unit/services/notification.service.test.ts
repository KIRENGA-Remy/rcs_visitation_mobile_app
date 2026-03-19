/**
 * Unit Tests: NotificationService
 * Tests: send, broadcast, markRead auth, unreadCount
 */
process.env.DATABASE_URL       = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET         = 'test-jwt-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-long-enough-32c';
process.env.BCRYPT_ROUNDS      = '1';

import { prismaMock } from '../../helpers/prisma.mock';
jest.mock('../../../config/prisma', () => ({ prisma: prismaMock }));

import { NotificationService } from '../../../modules/notifications/notification.service';
import { makeUser, TEST_IDS } from '../../helpers/auth.helper';

const svc = new NotificationService();

const makeNotif = (overrides: any = {}) => ({
  id: TEST_IDS.notification, userId: TEST_IDS.visitor,
  type: 'VISIT_APPROVED', channel: 'IN_APP',
  title: 'Visit Approved', body: 'Your visit has been approved',
  isRead: false, readAt: null, isSent: true, sentAt: new Date(),
  failedAt: null, failReason: null, visitRequestId: null, deliveryMeta: null,
  createdAt: new Date(),
  ...overrides,
});

describe('NotificationService.markRead', () => {
  it('throws when notification belongs to different user', async () => {
    prismaMock.notification.findUniqueOrThrow.mockResolvedValue(
      makeNotif({ userId: 'other-user-id' }) as any
    );
    await expect(svc.markRead(TEST_IDS.notification, TEST_IDS.visitor))
      .rejects.toThrow('Not your notification');
  });

  it('marks notification as read for correct user', async () => {
    prismaMock.notification.findUniqueOrThrow.mockResolvedValue(makeNotif() as any);
    prismaMock.notification.update.mockResolvedValue(makeNotif({ isRead: true }) as any);
    const result = await svc.markRead(TEST_IDS.notification, TEST_IDS.visitor);
    expect(prismaMock.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isRead: true }) })
    );
  });
});

describe('NotificationService.markAllRead', () => {
  it('marks all unread notifications as read for user', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 5 });
    const result = await svc.markAllRead(TEST_IDS.visitor);
    expect(result.updated).toBe(5);
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: TEST_IDS.visitor, isRead: false }) })
    );
  });
});

describe('NotificationService.broadcast', () => {
  it('sends to all active users of specified role', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: 'u1' }, { id: 'u2' }, { id: 'u3' },
    ] as any);
    prismaMock.notification.createMany.mockResolvedValue({ count: 3 });

    const result = await svc.broadcast({
      role: 'VISITOR', type: 'SYSTEM_ALERT', channel: 'IN_APP',
      title: 'System Alert', body: 'Maintenance at 3pm',
    });
    expect(result.sent).toBe(3);
    expect(prismaMock.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ userId: 'u1' })]) })
    );
  });
});

describe('NotificationService.unreadCount', () => {
  it('returns count of unread notifications', async () => {
    prismaMock.notification.count.mockResolvedValue(4);
    const count = await svc.unreadCount(TEST_IDS.visitor);
    expect(count).toBe(4);
    expect(prismaMock.notification.count).toHaveBeenCalledWith({
      where: { userId: TEST_IDS.visitor, isRead: false },
    });
  });
});
