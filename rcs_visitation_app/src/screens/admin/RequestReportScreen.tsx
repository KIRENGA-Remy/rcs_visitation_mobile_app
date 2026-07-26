import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { usersApi } from '@api/users';
import { reportRequestsApi } from '@api/reportRequests';
import { extractApiError, formatDate, formatTime } from '@utils';

export const RequestReportScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();

  const [targetOfficerId, setTargetOfficerId] = useState<string | null>(null); // null = all officers
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // default: tomorrow
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: officersData } = useQuery({
    queryKey: ['users', 'officers-list'],
    queryFn: () => usersApi.list({ role: 'PRISON_OFFICER', limit: 100 }),
  });

  const handleSubmit = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Title is required' });
      return;
    }
    setSaving(true);
    try {
      await reportRequestsApi.create({
        targetOfficerId,
        title: title.trim(),
        message: message || undefined,
        dueDate: hasDeadline ? dueDate.toISOString() : undefined,
      });
      qc.invalidateQueries({ queryKey: ['report-requests'] });
      Toast.show({
        type: 'success',
        text1: 'Report requested',
        text2: targetOfficerId ? 'The officer has been notified.' : 'All officers have been notified.',
      });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Request failed', text2: extractApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title="Request a Report" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>Send To</Text>
        <View style={{ gap: 8, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setTargetOfficerId(null)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10,
              backgroundColor: targetOfficerId === null ? `${COLORS.primary}12` : COLORS.white,
              borderWidth: 1.5, borderColor: targetOfficerId === null ? COLORS.primary : COLORS.border,
            }}
          >
            <Ionicons name="people" size={18} color={targetOfficerId === null ? COLORS.primary : COLORS.textMuted} />
            <Text style={{ fontWeight: '600', color: targetOfficerId === null ? COLORS.primary : COLORS.text }}>
              All Officers
            </Text>
          </TouchableOpacity>

          {officersData?.data?.map((o) => (
            <TouchableOpacity
              key={o.id}
              onPress={() => setTargetOfficerId(o.id)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10,
                backgroundColor: targetOfficerId === o.id ? `${COLORS.primary}12` : COLORS.white,
                borderWidth: 1.5, borderColor: targetOfficerId === o.id ? COLORS.primary : COLORS.border,
              }}
            >
              <Ionicons name="person" size={18} color={targetOfficerId === o.id ? COLORS.primary : COLORS.textMuted} />
              <Text style={{ fontWeight: '600', color: targetOfficerId === o.id ? COLORS.primary : COLORS.text }}>
                {o.firstName} {o.lastName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Title *"
          value={title}
          onChangeText={setTitle}
          leftIcon="document-text-outline"
          placeholder='e.g. "Report of visit done on 12/03/2026 is required"'
        />
        <Input label="Message (optional)" value={message} onChangeText={setMessage} leftIcon="chatbubble-outline" multiline style={{ height: 90 }} />

        <TouchableOpacity
          onPress={() => setHasDeadline(!hasDeadline)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: hasDeadline ? 12 : 20 }}
        >
          <View style={{
            width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
            borderColor: hasDeadline ? COLORS.primary : COLORS.border,
            backgroundColor: hasDeadline ? COLORS.primary : COLORS.white,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {hasDeadline && <Ionicons name="checkmark" size={15} color={COLORS.white} />}
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>Set a deadline</Text>
        </TouchableOpacity>

        {hasDeadline && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 10,
                borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white, paddingHorizontal: 12,
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, color: COLORS.text }}>{formatDate(dueDate.toISOString())}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 10,
                borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white, paddingHorizontal: 12,
              }}
            >
              <Ionicons name="time-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, color: COLORS.text }}>{formatTime(dueDate.toISOString())}</Text>
            </TouchableOpacity>
          </View>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, selected) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (event.type === 'set' && selected) {
                const merged = new Date(dueDate);
                merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                setDueDate(merged);
              }
              if (Platform.OS === 'android') setShowDatePicker(false);
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={dueDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selected) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (event.type === 'set' && selected) {
                const merged = new Date(dueDate);
                merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                setDueDate(merged);
              }
              if (Platform.OS === 'android') setShowTimePicker(false);
            }}
          />
        )}

        <Button title="Send Request" onPress={handleSubmit} loading={saving} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
};
