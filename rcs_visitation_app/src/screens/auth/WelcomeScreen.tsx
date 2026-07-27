import React from 'react';
import { View, Text, StatusBar, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '@constants';

const { height: SCREEN_H } = Dimensions.get('window');

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Visual half — the actual "illustration", built from shapes/icons */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={{ height: SCREEN_H * 0.52, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      >
        {/* Faint concentric rings — a radar/reach motif, subtle, not busy */}
        <View style={{
          position: 'absolute', width: 340, height: 340, borderRadius: 170,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
        }} />
        <View style={{
          position: 'absolute', width: 260, height: 260, borderRadius: 130,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
        }} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          {/* The facility */}
          <View style={{
            width: 64, height: 64, borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.14)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
          }}>
            <Ionicons name="business" size={30} color={COLORS.white} />
          </View>

          {/* The connecting visit — a real, literal arc, not decoration */}
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 46, height: 2, backgroundColor: 'rgba(255,255,255,0.4)',
              borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
            }} />
            <Ionicons name="qr-code" size={20} color={COLORS.accent} style={{ marginTop: 10 }} />
          </View>

          {/* The visitor */}
          <View style={{
            width: 64, height: 64, borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.14)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
          }}>
            <Ionicons name="people" size={30} color={COLORS.white} />
          </View>
        </View>

        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <Text style={{ color: COLORS.white, fontSize: 26, fontWeight: '800', letterSpacing: 0.5 }}>
            RCS Visitation
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, letterSpacing: 2, marginTop: 6 }}>
            RWANDA CORRECTIONAL SERVICE
          </Text>
        </View>
      </LinearGradient>

      {/* Content half — three short, concrete capabilities, not marketing copy */}
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 32, justifyContent: 'space-between' }}>
        <View style={{ gap: 22 }}>
          <FeatureRow icon="calendar-outline"      text="Book a visit and track its status in real time" />
          <FeatureRow icon="qr-code-outline"        text="Skip the paperwork with a QR code at the gate" />
          <FeatureRow icon="notifications-outline"  text="Get notified the moment a visit is approved" />
        </View>

        <View style={{ paddingBottom: 36 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.9}
            accessibilityRole="button"
            style={{
              backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
              alignItems: 'center', marginBottom: 12,
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '700' }}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
            style={{ alignItems: 'center', paddingVertical: 10 }}
          >
            <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
              Already have an account? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const FeatureRow: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
    <View style={{
      width: 40, height: 40, borderRadius: 12, backgroundColor: `${COLORS.primary}12`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Ionicons name={icon as any} size={20} color={COLORS.primary} />
    </View>
    <Text style={{ flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 }}>{text}</Text>
  </View>
);
