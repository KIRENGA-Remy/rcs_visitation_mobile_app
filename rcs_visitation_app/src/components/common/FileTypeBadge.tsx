import React from 'react';
import { View, Text } from 'react-native';

/**
 * Shows the actual file extension in a colored tag, the way Google Drive
 * or Dropbox distinguish file types — genuinely informative (you can tell
 * PDF from DOCX from XLSX at a glance) rather than a generic "document"
 * icon in a rounded square, which looks the same for every file type.
 */
const TYPE_MAP: Record<string, { label: string; bg: string; fg: string }> = {
  'application/pdf':                                                          { label: 'PDF',  bg: '#FEE2E2', fg: '#B91C1C' },
  'application/msword':                                                       { label: 'DOC',  bg: '#DBEAFE', fg: '#1D4ED8' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':   { label: 'DOCX', bg: '#DBEAFE', fg: '#1D4ED8' },
  'application/vnd.ms-excel':                                                 { label: 'XLS',  bg: '#DCFCE7', fg: '#15803D' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':        { label: 'XLSX', bg: '#DCFCE7', fg: '#15803D' },
  'text/plain':                                                               { label: 'TXT',  bg: '#F1F5F9', fg: '#475569' },
  'image/jpeg':                                                               { label: 'JPG',  bg: '#F3E8FF', fg: '#7E22CE' },
  'image/png':                                                                { label: 'PNG',  bg: '#F3E8FF', fg: '#7E22CE' },
};
const FALLBACK = { label: 'FILE', bg: '#F1F5F9', fg: '#475569' };

interface FileTypeBadgeProps {
  mimeType: string;
  size?: 'sm' | 'md';
}

export const FileTypeBadge: React.FC<FileTypeBadgeProps> = ({ mimeType, size = 'md' }) => {
  const { label, bg, fg } = TYPE_MAP[mimeType] ?? FALLBACK;
  const dimension = size === 'md' ? 44 : 34;

  return (
    <View style={{
      width: dimension, height: dimension, borderRadius: 10,
      backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size === 'md' ? 10 : 9, fontWeight: '800', color: fg, letterSpacing: 0.3 }}>
        {label}
      </Text>
    </View>
  );
};
