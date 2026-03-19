import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants';
import { useTranslation } from '@hooks/useTranslation';

export const OfflineBanner: React.FC = () => {
  const netInfo   = useNetInfo();
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const { t }     = useTranslation();

  const isOffline = netInfo.isConnected === false;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 0 : -50,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 999,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View style={{
        backgroundColor: '#1F2937',
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}>
        <Ionicons name="cloud-offline-outline" size={16} color="#FCD34D" />
        <Text style={{ color: '#FCD34D', fontWeight: '700', fontSize: 13 }}>
          {t('no_internet')}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
          — {t('no_internet_msg')}
        </Text>
      </View>
    </Animated.View>
  );
};
