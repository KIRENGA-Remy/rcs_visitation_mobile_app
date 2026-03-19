import { z } from 'zod';

export const scanQrSchema = z.object({
  qrCode: z.string().min(5, 'QR code is required'),
});

export type ScanQrDto = z.infer<typeof scanQrSchema>;
