import React from 'react';
import { View, Text, Image } from 'react-native';
import { getInitials, avatarColor } from '@utils';

interface AvatarProps {
  firstName: string;
  lastName: string;
  photoUrl?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ firstName, lastName, photoUrl, size = 44 }) => {
  const initials = getInitials(firstName, lastName);
  const bg = avatarColor(`${firstName}${lastName}`);

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: bg,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontSize: size * 0.36, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
};
