import { prisma } from '../../config/prisma';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { SendNotificationDto, BroadcastDto } from './notification.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';

export class NotificationService {

  // Internal helper — used by other services (e.g. on visit approval)
  async send(dto: {
    userId: string;
    type: NotificationType;
    channel?: NotificationChannel;
    title: string;
    body: string;
    visitRequestId?: string;
  }) {

    // 1️⃣ Create notification in DB
    const notification = await prisma.notification.create({
      data: {
        userId:        dto.userId,
        type:          dto.type,
        channel:       dto.channel ?? 'IN_APP',
        title:         dto.title,
        body:          dto.body,
        visitRequestId:dto.visitRequestId,
        isSent:        true,   // In production: integrate SMS/email provider here
        sentAt:        new Date(),
      },
    });

    // 2️⃣ Fetch Expo push token
    const pushToken = await prisma.user.findUnique({
      where: { id: dto.userId },
      select: { expoPushToken: true },
    });

    // 3️⃣ Send push notification if token exists
    if (pushToken?.expoPushToken) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to:    pushToken.expoPushToken,
          title: dto.title,
          body:  dto.body,
          data:  { type: dto.type, visitRequestId: dto.visitRequestId },
        }),
      });
    }

    // 4️⃣ Return the DB record
    return notification;
  }

  // Admin: send to a specific user
  async sendToUser(dto: SendNotificationDto) {
    await prisma.user.findUniqueOrThrow({ where: { id: dto.userId } });
    return this.send({
      userId:        dto.userId,
      type:          dto.type,
      channel:       dto.channel,
      title:         dto.title,
      body:          dto.body,
      visitRequestId:dto.visitRequestId,
    });
  }

  // Admin: broadcast to all users of a role or in a prison
  async broadcast(dto: BroadcastDto) {
    const where: any = { status: 'ACTIVE' };
    if (dto.role) where.role = dto.role;
    const users = await prisma.user.findMany({ where, select: { id: true } });

    const notifications = await prisma.notification.createMany({
      data: users.map(u => ({
        userId:  u.id,
        type:    dto.type,
        channel: dto.channel,
        title:   dto.title,
        body:    dto.body,
        isSent:  true,
        sentAt:  new Date(),
      })),
    });
    return { sent: notifications.count };
  }

  // User: list own notifications
  async findMyNotifications(userId: string, query: { page?: unknown; limit?: unknown; unreadOnly?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = { userId };
    if (query.unreadOnly === 'true') where.isRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);
    return { notifications, pagination: buildPagination(page, limit, total) };
  }

  // User: unread count badge
  async unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  // User: mark one as read
  async markRead(id: string, userId: string) {
    const notif = await prisma.notification.findUniqueOrThrow({ where: { id } });
    if (notif.userId !== userId) throw new Error('Not your notification');
    return prisma.notification.update({
      where: { id },
      data:  { isRead: true, readAt: new Date() },
    });
  }

  // User: mark all as read
  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  // Admin: delete a notification
  async delete(id: string) {
    return prisma.notification.delete({ where: { id } });
  }
}

export const notificationService = new NotificationService();
