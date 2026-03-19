import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants';

export const SplashScreen: React.FC = () => {
  const logoScale  = useRef(new Animated.Value(0.3)).current;
  const logoOpacity= useRef(new Animated.Value(0)).current;
  const textOpacity= useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={[COLORS.primaryDark, COLORS.primary, COLORS.primaryLight]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity, alignItems: 'center' }}>
        <View style={{
          width: 100, height: 100, borderRadius: 28,
          backgroundColor: 'rgba(255,255,255,0.15)',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
          marginBottom: 20,
        }}>
          <Ionicons name="shield-checkmark" size={52} color={COLORS.white} />
        </View>
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={{ color: COLORS.white, fontSize: 28, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>RCS Visitation</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: 2 }}>RWANDA CORRECTIONAL SERVICE</Text>
        <View style={{ width: 40, height: 3, backgroundColor: COLORS.accent, borderRadius: 2, marginTop: 16 }} />
      </Animated.View>
    </LinearGradient>
  );
};
