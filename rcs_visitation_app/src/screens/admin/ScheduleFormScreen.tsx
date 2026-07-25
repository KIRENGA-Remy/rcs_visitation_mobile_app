import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { COLORS, QUERY_KEYS, VISIT_TYPE_LABELS } from '@constants';
import { schedulesApi } from '@api/schedules';
import { prisonsApi } from '@api/prisons';
import { extractApiError, formatDate, formatTime } from '@utils';
import type { AdminStackParamList } from '@navigation/types';

const VISIT_TYPES = ['REGULAR', 'LEGAL', 'MEDICAL', 'OFFICIAL'];

/** A tappable field that opens the native date or time picker. */
const PickerField: React.FC<{
  label: string; value: Date; mode: 'date' | 'time'; onChange: (d: Date) => void; minimumDate?: Date;
}> = ({ label, value, mode, onChange, minimumDate }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 16, flex: 1 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 }}>{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 10,
          borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white, paddingHorizontal: 12,
        }}
      >
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 14, color: COLORS.text }}>
          {mode === 'date' ? formatDate(value.toISOString()) : formatTime(value.toISOString())}
        </Text>
      </TouchableOpacity>
      {open && (
        <DateTimePicker
          value={value}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          onChange={(event, selected) => {
            setOpen(Platform.OS === 'ios');
            if (event.type === 'set' && selected) onChange(selected);
            if (Platform.OS === 'android') setOpen(false);
          }}
        />
      )}
    </View>
  );
};

/** Create when route.params has no id, Edit when it does. */
export const ScheduleFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AdminStackParamList, 'ScheduleForm'>>();
  const editId = route.params?.id;
  const isEdit = !!editId;
  const qc = useQueryClient();

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['schedules', 'detail', editId],
    queryFn: () => schedulesApi.get(editId!),
    enabled: isEdit,
  });

  const { data: prisonsData } = useQuery({
    queryKey: ['prisons', 'all'],
    queryFn: () => prisonsApi.list({ limit: 100 }),
    enabled: !isEdit,
  });

  const [prisonId, setPrisonId] = useState('');
  const [label, setLabel] = useState('');
  const [visitType, setVisitType] = useState('REGULAR');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3 * 60 * 60 * 1000));
  const [maxCapacity, setMaxCapacity] = useState('20');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setLabel(existing.label ?? '');
      setStartTime(new Date(existing.startTime));
      setEndTime(new Date(existing.endTime));
      setMaxCapacity(String(existing.maxCapacity));
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  /** Merges the calendar day from `date` with the time-of-day from a
   *  separately-picked time value — `startTime`/`endTime` are edited via
   *  their own time-only pickers, so on their own they still carry
   *  whatever day they were initialized with (today), not the day chosen
   *  in the date picker. Without this, creating a schedule for a future
   *  date while only touching the time pickers silently submitted a
   *  timestamp still dated today — which, if that time-of-day had already
   *  passed, landed in the past and made the schedule invisible under the
   *  "future schedules only" default filter. */
  const combineDateAndTime = (day: Date, time: Date): Date => {
    const combined = new Date(day);
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return combined;
  };

  const handleSave = async () => {
    const capacity = parseInt(maxCapacity, 10);
    if (!capacity || capacity < 1) {
      Toast.show({ type: 'error', text1: 'Enter a valid capacity' });
      return;
    }
    if (!isEdit && !prisonId) {
      Toast.show({ type: 'error', text1: 'Select a prison' });
      return;
    }

    const combinedStart = isEdit ? startTime : combineDateAndTime(date, startTime);
    const combinedEnd   = isEdit ? endTime   : combineDateAndTime(date, endTime);

    if (combinedEnd <= combinedStart) {
      Toast.show({ type: 'error', text1: 'End time must be after start time' });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await schedulesApi.update(editId!, {
          startTime: combinedStart.toISOString(),
          endTime: combinedEnd.toISOString(),
          label: label || undefined,
          maxCapacity: capacity,
          notes: notes || undefined,
        });
        qc.invalidateQueries({ queryKey: ['schedules', 'detail', editId] });
        Toast.show({ type: 'success', text1: 'Schedule updated', text2: 'Affected visitors and officers were notified.' });
      } else {
        await schedulesApi.create({
          prisonId,
          date: date.toISOString().split('T')[0],
          startTime: combinedStart.toISOString(),
          endTime: combinedEnd.toISOString(),
          label: label || undefined,
          maxCapacity: capacity,
          visitType,
          notes: notes || undefined,
        });
        Toast.show({ type: 'success', text1: 'Schedule created' });

      }
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULES });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: extractApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loadingExisting) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title={isEdit ? 'Edit Schedule' : 'New Schedule'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {!isEdit && (
          <>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>Prison *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {prisonsData?.data?.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPrisonId(p.id)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                      backgroundColor: prisonId === p.id ? COLORS.primary : COLORS.white,
                      borderWidth: 1.5, borderColor: prisonId === p.id ? COLORS.primary : COLORS.border,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: prisonId === p.id ? COLORS.white : COLORS.text }}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <PickerField label="Date" mode="date" value={date} onChange={setDate} minimumDate={new Date()} />

            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>Visit Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {VISIT_TYPES.map((vt) => (
                <TouchableOpacity
                  key={vt}
                  onPress={() => setVisitType(vt)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                    backgroundColor: visitType === vt ? COLORS.primary : COLORS.white,
                    borderWidth: 1.5, borderColor: visitType === vt ? COLORS.primary : COLORS.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: visitType === vt ? COLORS.white : COLORS.text }}>
                    {VISIT_TYPE_LABELS[vt as keyof typeof VISIT_TYPE_LABELS] ?? vt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PickerField label="Start Time" mode="time" value={startTime} onChange={setStartTime} />
          <PickerField label="End Time" mode="time" value={endTime} onChange={setEndTime} />
        </View>

        <Input label="Label" value={label} onChangeText={setLabel} leftIcon="pricetag-outline" placeholder="e.g. Morning Session" />
        <Input label="Max Capacity *" value={maxCapacity} onChangeText={setMaxCapacity} leftIcon="people-outline" keyboardType="number-pad" />
        <Input label="Notes" value={notes} onChangeText={setNotes} leftIcon="document-text-outline" multiline style={{ height: 70 }} />

        {isEdit && (
          <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.warning} />
            <Text style={{ flex: 1, fontSize: 12, color: '#92400E' }}>
              Changing the time will notify affected visitors and assigned officers.
            </Text>
          </View>
        )}

        <Button
          title={isEdit ? 'Save Changes' : 'Create Schedule'}
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </View>
  );
};
