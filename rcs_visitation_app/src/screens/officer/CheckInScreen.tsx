import React, { useState } from 'react';
import {
  View, Text, ScrollView, StatusBar, TouchableOpacity, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { Avatar } from '@components/common/Avatar';
import { COLORS, QUERY_KEYS } from '@constants';
import { visitRequestsApi } from '@api/visitRequests';
import { visitLogsApi } from '@api/visitLogs';
import { formatDate, formatTime, extractApiError } from '@utils';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params: { visitRequestId: string } };
};

export const CheckInScreen: React.FC<Props> = ({ navigation, route }) => {
  const { visitRequestId } = route.params;
  const qc = useQueryClient();

  const [adults, setAdults]     = useState(1);
  const [children, setChildren] = useState(0);
  const [itemsIn, setItemsIn]   = useState('');
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: QUERY_KEYS.VISIT_REQUEST(visitRequestId),
    queryFn:  () => visitRequestsApi.get(visitRequestId),
  });

  if (isLoading || !request) return <LoadingScreen />;

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await visitLogsApi.checkIn({
        visitRequestId,
        actualAdultsPresent:   adults,
        actualChildrenPresent: children,
        itemsCarriedIn: itemsIn || undefined,
        officerNotes:   notes   || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['visit-requests'] });
      Toast.show({ type: 'success', text1: '✓ Visitor Checked In', text2: 'Visit log created' });
      navigation.replace('CheckOut', { visitRequestId });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Check-In Failed', text2: extractApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  const v = request.visitorProfile?.user;
  const p = request.prisoner;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title="Check In Visitor" subtitle="Record visitor arrival" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">

        {/* Visitor identity card */}
        {v && (
          <Card variant="elevated" style={{ marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.success }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Avatar firstName={v.firstName} lastName={v.lastName} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.text }}>
                  {v.firstName} {v.lastName}
                </Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 2 }}>{v.phone}</Text>
                {v.nationalId && (
                  <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>NID: {v.nationalId}</Text>
                )}
              </View>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${COLORS.success}15`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person-outline" size={18} color={COLORS.success} />
              </View>
            </View>
          </Card>
        )}

        {/* Prisoner */}
        {p && (
          <Card variant="elevated" style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Visiting Prisoner
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
              {p.firstName} {p.lastName}
            </Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>
              #{p.prisonerNumber}{p.cellBlock ? ` · Cell ${p.cellBlock}` : ''}
            </Text>
          </Card>
        )}

        {/* Schedule */}
        {request.schedule && (
          <Card variant="flat" style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={{ color: COLORS.text, fontWeight: '600' }}>
                {formatDate(request.schedule.startTime)} · {formatTime(request.schedule.startTime)} – {formatTime(request.schedule.endTime)}
              </Text>
            </View>
          </Card>
        )}

        {/* Actual visitor count */}
        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 }}>
          Confirm Visitor Count
        </Text>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Adults', value: adults, min: 1, max: 5, set: setAdults },
            { label: 'Children', value: children, min: 0, max: 5, set: setChildren },
          ].map((item) => (
            <Card key={item.label} variant="elevated" style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12, fontWeight: '600' }}>{item.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <TouchableOpacity
                  onPress={() => item.set(Math.max(item.min, item.value - 1))}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border }}
                >
                  <Ionicons name="remove" size={18} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, minWidth: 28, textAlign: 'center' }}>
                  {item.value}
                </Text>
                <TouchableOpacity
                  onPress={() => item.set(Math.min(item.max, item.value + 1))}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="add" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>

        {/* Items carried in */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
            Items Carried In (optional)
          </Text>
          <View style={{ borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, backgroundColor: COLORS.white }}>
            <TextInput
              value={itemsIn}
              onChangeText={setItemsIn}
              placeholder="e.g. ID card, food items, clothing..."
              placeholderTextColor={COLORS.textLight}
              style={{ fontSize: 14, color: COLORS.text, minHeight: 60 }}
              multiline
            />
          </View>
        </View>

        {/* Officer notes */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
            Officer Notes (optional)
          </Text>
          <View style={{ borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, backgroundColor: COLORS.white }}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any observations at check-in..."
              placeholderTextColor={COLORS.textLight}
              style={{ fontSize: 14, color: COLORS.text, minHeight: 60 }}
              multiline
            />
          </View>
        </View>
      </ScrollView>

      {/* Fixed bottom action */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 20, paddingBottom: 32, borderTopWidth: 1, borderTopColor: COLORS.border }}>
        <Button
          title="Confirm Check-In"
          onPress={handleCheckIn}
          loading={loading}
          leftIcon={<Ionicons name="enter-outline" size={18} color={COLORS.white} />}
        />
      </View>
    </View>
  );
};
