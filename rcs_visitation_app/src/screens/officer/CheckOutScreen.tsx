import React, { useState } from 'react';
import {
  View, Text, ScrollView, StatusBar, TouchableOpacity, TextInput, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS, INCIDENT_LABELS } from '@constants';
import { visitRequestsApi } from '@api/visitRequests';
import { visitLogsApi } from '@api/visitLogs';
import { formatDateTime, formatDuration, extractApiError } from '@utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { VisitLogIncidentType } from '@types';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params: { visitRequestId: string } };
};

const INCIDENT_TYPES: VisitLogIncidentType[] = [
  'NONE', 'CONTRABAND', 'BEHAVIOUR', 'OVERSTAY', 'UNAUTHORIZED', 'OTHER'
];

const QUALITY_OPTIONS = [
  { value: 'NORMAL',   label: 'Normal',   icon: 'happy-outline',    color: COLORS.success },
  { value: 'TENSE',    label: 'Tense',    icon: 'alert-outline',    color: COLORS.warning },
  { value: 'EMOTIONAL',label: 'Emotional',icon: 'heart-outline',    color: COLORS.info },
];

export const CheckOutScreen: React.FC<Props> = ({ navigation, route }) => {
  const { visitRequestId } = route.params;
  const qc = useQueryClient();

  const [incident, setIncident]       = useState<VisitLogIncidentType>('NONE');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [confiscated, setConfiscated] = useState('');
  const [officerNotes, setOfficerNotes] = useState('');
  const [quality, setQuality]         = useState<'NORMAL' | 'TENSE' | 'EMOTIONAL'>('NORMAL');
  const [loading, setLoading]         = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [checkedOutLog, setCheckedOutLog] = useState<any>(null);

  const { data: request, isLoading } = useQuery({
    queryKey: QUERY_KEYS.VISIT_REQUEST(visitRequestId),
    queryFn:  () => visitRequestsApi.get(visitRequestId),
  });

  if (isLoading || !request) return <LoadingScreen />;

  const log = request.visitLog;
  const checkinTime = log?.actualCheckinTime;
  const durationSoFar = checkinTime
    ? Math.round((Date.now() - new Date(checkinTime).getTime()) / 60000)
    : 0;

  const handleCheckOut = async () => {
    if (incident !== 'NONE' && !incidentNotes.trim()) {
      Toast.show({ type: 'error', text1: 'Incident notes required', text2: 'Please describe the incident' });
      return;
    }
    if (!log?.id) {
      Toast.show({ type: 'error', text1: 'Visit log not found' });
      return;
    }

    setLoading(true);
    try {
      const result = await visitLogsApi.checkOut(log.id, {
        incidentType:     incident,
        incidentNotes:    incidentNotes || undefined,
        itemsConfiscated: confiscated   || undefined,
        officerNotes:     officerNotes  || undefined,
        visitQuality:     quality,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['visit-requests'] });
      setCheckedOutLog(result);
      setSuccessModal(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Check-Out Failed', text2: extractApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title="Check Out Visitor" subtitle="End visit and log outcome" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">

        {/* Visit timer */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={{ borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' }}
        >
          <Ionicons name="timer-outline" size={28} color="rgba(255,255,255,0.8)" />
          <Text style={{ color: COLORS.white, fontSize: 36, fontWeight: '800', marginTop: 8 }}>
            {formatDuration(durationSoFar)}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Time elapsed since check-in</Text>
          {checkinTime && (
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 }}>
              Checked in: {formatDateTime(checkinTime)}
            </Text>
          )}
        </LinearGradient>

        {/* Visitor + Prisoner summary */}
        {request.visitorProfile?.user && request.prisoner && (
          <Card variant="flat" style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="people-outline" size={18} color={COLORS.primary} />
              <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 14 }}>
                {request.visitorProfile.user.firstName} {request.visitorProfile.user.lastName}
                <Text style={{ color: COLORS.textMuted }}> visiting </Text>
                {request.prisoner.firstName} {request.prisoner.lastName}
              </Text>
            </View>
          </Card>
        )}

        {/* Visit Quality */}
        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
          Visit Quality
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          {QUALITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setQuality(opt.value as any)}
              style={{
                flex: 1,
                backgroundColor: quality === opt.value ? opt.color : COLORS.white,
                borderRadius: 12,
                padding: 14,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: quality === opt.value ? opt.color : COLORS.border,
                gap: 6,
              }}
            >
              <Ionicons
                name={opt.icon as any}
                size={22}
                color={quality === opt.value ? COLORS.white : opt.color}
              />
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: quality === opt.value ? COLORS.white : COLORS.textMuted,
              }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Incident Type */}
        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
          Incident Report
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {INCIDENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setIncident(type)}
              style={{
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: incident === type
                  ? (type === 'NONE' ? COLORS.success : COLORS.error)
                  : COLORS.surface,
                borderWidth: 1.5,
                borderColor: incident === type
                  ? (type === 'NONE' ? COLORS.success : COLORS.error)
                  : COLORS.border,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: incident === type ? COLORS.white : COLORS.textMuted,
              }}>
                {INCIDENT_LABELS[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {incident !== 'NONE' && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.error, marginBottom: 8 }}>
              Incident Notes *
            </Text>
            <View style={{ borderWidth: 1.5, borderColor: COLORS.error, borderRadius: 12, padding: 12, backgroundColor: '#FEF2F2' }}>
              <TextInput
                value={incidentNotes}
                onChangeText={setIncidentNotes}
                placeholder="Describe the incident in detail..."
                placeholderTextColor="#FCA5A5"
                style={{ fontSize: 14, color: COLORS.text, minHeight: 80 }}
                multiline
              />
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
                Items Confiscated
              </Text>
              <View style={{ borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, backgroundColor: COLORS.white }}>
                <TextInput
                  value={confiscated}
                  onChangeText={setConfiscated}
                  placeholder="List confiscated items..."
                  placeholderTextColor={COLORS.textLight}
                  style={{ fontSize: 14, color: COLORS.text, minHeight: 60 }}
                  multiline
                />
              </View>
            </View>
          </View>
        )}

        {/* Officer notes */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
            Officer Notes (optional)
          </Text>
          <View style={{ borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, backgroundColor: COLORS.white }}>
            <TextInput
              value={officerNotes}
              onChangeText={setOfficerNotes}
              placeholder="Any additional observations..."
              placeholderTextColor={COLORS.textLight}
              style={{ fontSize: 14, color: COLORS.text, minHeight: 60 }}
              multiline
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 20, paddingBottom: 32, borderTopWidth: 1, borderTopColor: COLORS.border }}>
        <Button
          title="Complete Check-Out"
          onPress={handleCheckOut}
          loading={loading}
          leftIcon={<Ionicons name="exit-outline" size={18} color={COLORS.white} />}
        />
      </View>

      {/* Success modal */}
      <Modal visible={successModal} transparent animationType="fade">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.overlay }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 32, alignItems: 'center', margin: 24, width: '85%' }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: `${COLORS.success}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Ionicons name="checkmark-circle" size={44} color={COLORS.success} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 }}>
              Visit Completed
            </Text>
            <Text style={{ color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 }}>
              Visitor has been checked out successfully.
              {checkedOutLog?.durationMinutes ? `\nDuration: ${formatDuration(checkedOutLog.durationMinutes)}` : ''}
            </Text>
            {incident !== 'NONE' && (
              <View style={{ backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginTop: 16, width: '100%' }}>
                <Text style={{ color: COLORS.error, fontWeight: '700', fontSize: 13, textAlign: 'center' }}>
                  ⚠ Incident flagged for review
                </Text>
              </View>
            )}
            <Button
              title="Done"
              onPress={() => {
                setSuccessModal(false);
                navigation.popToTop();
              }}
              style={{ marginTop: 24, width: '100%' }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
