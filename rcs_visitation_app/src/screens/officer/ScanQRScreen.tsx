import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { StatusBadge } from '@components/common/StatusBadge';
import { COLORS } from '@constants';
import { useTranslation } from '@hooks/useTranslation';
import { verificationApi } from '@api/verification';
import { formatDate, formatTime } from '@utils';

type ScanState = 'scanning' | 'processing' | 'valid' | 'invalid';

export const ScanQRScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState]   = useState<ScanState>('scanning');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanned, setScanned]       = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (scanState === 'scanning') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [scanState]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || scanState !== 'scanning') return;
    setScanned(true);
    setScanState('processing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await verificationApi.scan(data);
      setScanResult(result);
      setScanState(result.valid ? 'valid' : 'invalid');
      Haptics.notificationAsync(
        result.valid ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
      );
    } catch (err: any) {
      setScanResult({ valid: false, reason: 'Network error. Please try again.' });
      setScanState('invalid');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const reset = () => {
    setScanState('scanning');
    setScanResult(null);
    setScanned(false);
  };

  const handleCheckIn = () => {
    if (scanResult?.visitRequestId) {
      navigation.navigate('CheckIn', { visitRequestId: scanResult.visitRequestId });
    }
  };

  if (hasPermission === null) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Requesting camera...</Text></View>;
  }

  if (hasPermission === false) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Ionicons name="camera-off" size={64} color={COLORS.error} />
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>Camera Permission Required</Text>
        <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 8 }}>
          Please enable camera access in your device settings to scan QR codes.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {scanState === 'scanning' && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarCodeScanned}
        >
          {/* Overlay */}
          <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 30 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
              <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>Scan Visitor QR Code</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Scanner frame */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{
              width: 240, height: 240, position: 'relative',
            }, { transform: [{ scale: pulseAnim }] }]}>
              {/* Corner markers */}
              {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
                <View key={i} style={[{
                  position: 'absolute', width: 40, height: 40,
                  borderColor: COLORS.accent, borderWidth: 3,
                  ...(pos as any),
                }, i === 0 ? { borderRightWidth: 0, borderBottomWidth: 0 }
                   : i === 1 ? { borderLeftWidth: 0, borderBottomWidth: 0 }
                   : i === 2 ? { borderRightWidth: 0, borderTopWidth: 0 }
                   : { borderLeftWidth: 0, borderTopWidth: 0 }]} />
              ))}
            </Animated.View>
            <Text style={{ color: COLORS.white, marginTop: 24, fontSize: 14, textAlign: 'center', opacity: 0.8 }}>
              Point camera at visitor's QR code
            </Text>
          </View>

          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={{ paddingBottom: 40, paddingHorizontal: 20, alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center' }}>
              The QR code is displayed in the visitor's app after approval
            </Text>
          </LinearGradient>
        </CameraView>
      )}

      {scanState === 'processing' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryDark }}>
          <Ionicons name="qr-code" size={60} color={COLORS.white} />
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', marginTop: 16 }}>Verifying...</Text>
        </View>
      )}

      {(scanState === 'valid' || scanState === 'invalid') && (
        <View style={{ flex: 1, backgroundColor: scanState === 'valid' ? COLORS.primary : '#DC2626', justifyContent: 'flex-end' }}>
          <View style={{ padding: 24, gap: 16 }}>
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name={scanState === 'valid' ? 'checkmark' : 'close'} size={44} color={COLORS.white} />
              </View>
              <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: '800', marginBottom: 8 }}>
                {scanState === 'valid' ? t('authorised') : t('denied')}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' }}>
                {scanResult?.reason ?? ''}
              </Text>
            </View>

            {scanState === 'valid' && scanResult?.request && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16, gap: 10 }}>
                {[
                  { label: 'Visitor',   value: `${scanResult.request.visitorProfile?.user?.firstName} ${scanResult.request.visitorProfile?.user?.lastName}` },
                  { label: 'NID',       value: scanResult.request.visitorProfile?.user?.nationalId ?? '—' },
                  { label: 'Visiting',  value: `${scanResult.request.prisoner?.firstName} ${scanResult.request.prisoner?.lastName}` },
                  { label: 'Prison',    value: scanResult.request.prisoner?.prison?.name ?? '—' },
                  { label: 'Slot',      value: scanResult.request.schedule?.startTime ? `${formatDate(scanResult.request.schedule.startTime)} · ${formatTime(scanResult.request.schedule.startTime)}` : '—' },
                ].map((row) => (
                  <View key={row.label} style={{ flexDirection: 'row', gap: 12 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', width: 72, fontSize: 13 }}>{row.label}</Text>
                    <Text style={{ color: COLORS.white, fontWeight: '600', flex: 1, fontSize: 13 }}>{row.value}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button title="Scan Again" onPress={reset} variant="outline" style={{ flex: 1, borderColor: COLORS.white }} textStyle={{ color: COLORS.white }} />
              {scanState === 'valid' && (
                <Button title="Check In →" onPress={handleCheckIn} style={{ flex: 1, backgroundColor: COLORS.white }} textStyle={{ color: COLORS.primary }} />
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
