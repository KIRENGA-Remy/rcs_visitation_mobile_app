import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '@constants';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = RADIUS.sm,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{
        width:        width as any,
        height,
        borderRadius,
        backgroundColor: COLORS.border,
        opacity,
      }, style]}
    />
  );
};

/** Pre-built skeleton for a visit request card */
export const VisitRequestSkeleton: React.FC = () => (
  <View style={{
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Skeleton width="55%" height={16} />
      <Skeleton width="22%" height={22} borderRadius={999} />
    </View>
    <Skeleton width="35%" height={12} />
    <Skeleton width="70%" height={12} />
    <Skeleton width="60%" height={12} />
    <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 2 }} />
    <Skeleton width="30%" height={22} borderRadius={6} />
  </View>
);

/** Stats card skeleton */
export const StatCardSkeleton: React.FC = () => (
  <View style={{ width: '47%', backgroundColor: COLORS.white, borderRadius: 14, padding: 16, gap: 10 }}>
    <Skeleton width={36} height={36} borderRadius={10} />
    <Skeleton width="50%" height={24} />
    <Skeleton width="70%" height={12} />
  </View>
);
