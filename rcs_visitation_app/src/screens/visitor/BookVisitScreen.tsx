import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Card } from '@components/common/Card';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS, VISIT_TYPE_LABELS } from '@constants';
import { visitorsApi } from '@api/visitors';
import { schedulesApi } from '@api/schedules';
import { useCreateVisitRequest } from '@hooks/useVisitRequests';
import { formatDate, formatTime, extractApiError } from '@utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { VisitorStackParamList } from '@navigation/types';
import type { VisitType } from '@types';

type Props = { navigation: NativeStackNavigationProp<VisitorStackParamList, 'BookVisit'> };

export const BookVisitScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedPrisonerId, setSelectedPrisonerId]   = useState('');
  const [selectedScheduleId, setSelectedScheduleId]   = useState('');
  const [visitType, setVisitType]   = useState<VisitType>('REGULAR');
  const [adults, setAdults]         = useState(1);
  const [children, setChildren]     = useState(0);
  const [purposeNote, setPurposeNote] = useState('');

  const { mutate: createRequest, isPending } = useCreateVisitRequest();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: QUERY_KEYS.MY_VISITOR,
    queryFn: visitorsApi.getMyProfile,
  });

  const selectedPrisoner = profile?.approvedPrisoners?.find(p => p.prisoner.id === selectedPrisonerId);
  const prisonId = selectedPrisoner?.prisoner.prison
    ? profile?.approvedPrisoners?.find(ap => ap.prisoner.id === selectedPrisonerId)?.prisoner.id
    : undefined;

  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULES, selectedPrisonerId],
    queryFn: () => {
      const ap = profile?.approvedPrisoners?.find(p => p.prisoner.id === selectedPrisonerId);
      return ap ? schedulesApi.list({ page: 1, limit: 20 }) : Promise.resolve({ data: [], pagination: undefined });
    },
    enabled: !!selectedPrisonerId,
  });

  if (profileLoading) return <LoadingScreen />;

  const hasPrisoners = (profile?.approvedPrisoners?.length ?? 0) > 0;

  const handleSubmit = () => {
    if (!selectedPrisonerId) { Toast.show({ type: 'error', text1: 'Select a prisoner to visit' }); return; }
    if (!selectedScheduleId) { Toast.show({ type: 'error', text1: 'Select a visit time slot' }); return; }

    createRequest({
      prisonerId: selectedPrisonerId,
      scheduleId: selectedScheduleId,
      visitType,
      numberOfAdults: adults,
      numberOfChildren: children,
      purposeNote: purposeNote || undefined,
    }, {
      onSuccess: (data) => {
        Toast.show({ type: 'success', text1: 'Request Submitted!', text2: `Reference: ${data.referenceNumber}` });
        navigation.navigate('RequestDetail', { id: data.id });
      },
      onError: (err) => Toast.show({ type: 'error', text1: 'Booking Failed', text2: extractApiError(err) }),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title="Book a Visit" subtitle="Schedule a prison visit" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

        {/* No approved prisoners */}
        {!hasPrisoners && (
          <Card variant="outlined" style={{ borderColor: COLORS.warning, backgroundColor: '#FFFBEB' }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <Ionicons name="warning-outline" size={22} color={COLORS.warning} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: '#92400E', fontSize: 14, marginBottom: 4 }}>No Approved Prisoners</Text>
                <Text style={{ color: '#92400E', fontSize: 13, lineHeight: 18 }}>
                  You must be approved to visit a prisoner first. Contact the prison administration to get approval.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {hasPrisoners && (
          <>
            {/* Step 1: Select Prisoner */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
                <Text style={{ color: COLORS.primary }}>1 </Text>Select Prisoner to Visit
              </Text>
              {profile?.approvedPrisoners?.map((ap) => (
                <TouchableOpacity
                  key={ap.prisoner.id}
                  onPress={() => { setSelectedPrisonerId(ap.prisoner.id); setSelectedScheduleId(''); }}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: selectedPrisonerId === ap.prisoner.id ? COLORS.primary : COLORS.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 15 }}>
                      {ap.prisoner.firstName} {ap.prisoner.lastName}
                    </Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                      #{ap.prisoner.prisonerNumber} · {ap.prisoner.prison.name}
                    </Text>
                    <Text style={{ color: COLORS.primary, fontSize: 12, marginTop: 2 }}>
                      Relationship: {ap.relationship}
                    </Text>
                  </View>
                  {selectedPrisonerId === ap.prisoner.id
                    ? <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    : <Ionicons name="radio-button-off" size={24} color={COLORS.border} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Step 2: Select Schedule */}
            {selectedPrisonerId && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
                  <Text style={{ color: COLORS.primary }}>2 </Text>Choose Visit Slot
                </Text>
                {schedulesLoading ? (
                  <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>Loading available slots...</Text>
                ) : schedulesData?.data?.filter(s => s.status === 'OPEN').length === 0 ? (
                  <Card variant="flat">
                    <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>No available slots at this time</Text>
                  </Card>
                ) : (
                  schedulesData?.data?.filter(s => s.status === 'OPEN').map((schedule) => (
                    <TouchableOpacity
                      key={schedule.id}
                      onPress={() => setSelectedScheduleId(schedule.id)}
                      activeOpacity={0.85}
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 8,
                        borderWidth: 2,
                        borderColor: selectedScheduleId === schedule.id ? COLORS.primary : COLORS.border,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={{ fontWeight: '700', color: COLORS.text }}>{schedule.label ?? 'Visit Slot'}</Text>
                          <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 2 }}>
                            {formatDate(schedule.startTime)} · {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
                          </Text>
                          <Text style={{ color: COLORS.success, fontSize: 12, marginTop: 2 }}>
                            {schedule.availableSlots} slots available
                          </Text>
                        </View>
                        {selectedScheduleId === schedule.id
                          ? <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                          : <Ionicons name="radio-button-off" size={24} color={COLORS.border} />}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* Step 3: Visit Details */}
            {selectedScheduleId && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
                  <Text style={{ color: COLORS.primary }}>3 </Text>Visit Details
                </Text>

                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>Visit Type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {(['REGULAR', 'LEGAL', 'MEDICAL', 'OFFICIAL'] as VisitType[]).map((vt) => (
                    <TouchableOpacity
                      key={vt}
                      onPress={() => setVisitType(vt)}
                      style={{
                        borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
                        backgroundColor: visitType === vt ? COLORS.primary : COLORS.surface,
                        borderWidth: 1.5,
                        borderColor: visitType === vt ? COLORS.primary : COLORS.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: visitType === vt ? COLORS.white : COLORS.textMuted }}>
                        {VISIT_TYPE_LABELS[vt]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>Adults (incl. yourself)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <TouchableOpacity onPress={() => setAdults(Math.max(1, adults - 1))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border }}>
                        <Ionicons name="remove" size={18} color={COLORS.text} />
                      </TouchableOpacity>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, minWidth: 24, textAlign: 'center' }}>{adults}</Text>
                      <TouchableOpacity onPress={() => setAdults(Math.min(5, adults + 1))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="add" size={18} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>Children</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <TouchableOpacity onPress={() => setChildren(Math.max(0, children - 1))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border }}>
                        <Ionicons name="remove" size={18} color={COLORS.text} />
                      </TouchableOpacity>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, minWidth: 24, textAlign: 'center' }}>{children}</Text>
                      <TouchableOpacity onPress={() => setChildren(Math.min(5, children + 1))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="add" size={18} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={{ marginTop: 16 }}>
                  <Input label="Purpose / Notes (optional)" placeholder="Reason for visit..." value={purposeNote} onChangeText={setPurposeNote} leftIcon="document-text-outline" multiline style={{ height: 80 }} />
                </View>
              </View>
            )}

            <Button
              title="Submit Visit Request"
              onPress={handleSubmit}
              loading={isPending}
              disabled={!selectedPrisonerId || !selectedScheduleId}
              style={{ marginTop: 8 }}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
};
