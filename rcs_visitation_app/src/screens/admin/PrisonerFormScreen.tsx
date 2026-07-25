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
import { COLORS, QUERY_KEYS } from '@constants';
import { prisonersApi } from '@api/prisoners';
import { prisonsApi } from '@api/prisons';
import { extractApiError, formatDate } from '@utils';
import type { AdminStackParamList } from '@navigation/types';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

/** A tappable field that opens the native date picker, styled to match Input. */
const DateField: React.FC<{
  label: string; value: Date | undefined; onChange: (d: Date) => void;
  required?: boolean; minimumDate?: Date; maximumDate?: Date;
}> = ({ label, value, onChange, required, minimumDate, maximumDate }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 }}>
        {label}{required ? ' *' : ''}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 10,
          borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white, paddingHorizontal: 14,
        }}
      >
        <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
        <Text style={{ fontSize: 15, color: value ? COLORS.text : COLORS.textLight }}>
          {value ? formatDate(value.toISOString()) : 'Select a date'}
        </Text>
      </TouchableOpacity>
      {open && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, selected) => {
            setOpen(Platform.OS === 'ios'); // iOS spinner stays open until dismissed by the user
            if (event.type === 'set' && selected) onChange(selected);
            if (Platform.OS === 'android') setOpen(false);
          }}
        />
      )}
    </View>
  );
};

/** Create when route.params has no `id`, Edit when it does. */
export const PrisonerFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AdminStackParamList, 'PrisonerForm'>>();
  const editId = route.params?.id;
  const isEdit = !!editId;
  const qc = useQueryClient();

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['prisoners', 'detail', editId],
    queryFn: () => prisonersApi.get(editId!),
    enabled: isEdit,
  });

  const { data: prisonsData } = useQuery({
    queryKey: ['prisons', 'all'],
    queryFn: () => prisonsApi.list({ limit: 100 }),
    enabled: !isEdit, // prison can't be changed here — use Transfer instead
  });

  const [prisonId, setPrisonId]           = useState('');
  const [prisonerNumber, setPrisonerNumber] = useState('');
  const [firstName, setFirstName]         = useState('');
  const [lastName, setLastName]           = useState('');
  const [gender, setGender]               = useState('MALE');
  const [nationalId, setNationalId]       = useState('');
  const [cellBlock, setCellBlock]         = useState('');
  const [cellNumber, setCellNumber]       = useState('');
  const [admissionDate, setAdmissionDate] = useState<Date | undefined>(undefined);
  const [expectedReleaseDate, setExpectedReleaseDate] = useState<Date | undefined>(undefined);
  const [offenseCategory, setOffenseCategory] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setFirstName(existing.firstName);
      setLastName(existing.lastName);
      setNationalId(existing.nationalId ?? '');
      setCellBlock(existing.cellBlock ?? '');
      setCellNumber(existing.cellNumber ?? '');
      setOffenseCategory(existing.offenseCategory ?? '');
      if (existing.expectedReleaseDate) setExpectedReleaseDate(new Date(existing.expectedReleaseDate));
    }
  }, [existing]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Toast.show({ type: 'error', text1: 'First and last name are required' });
      return;
    }
    if (!isEdit && (!prisonId || !prisonerNumber.trim() || !admissionDate)) {
      Toast.show({ type: 'error', text1: 'Prison, prisoner number, and admission date are required' });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await prisonersApi.update(editId!, {
          firstName: firstName.trim(),
          lastName:  lastName.trim(),
          cellBlock: cellBlock || undefined,
          cellNumber: cellNumber || undefined,
          offenseCategory: offenseCategory || undefined,
          nationalId: nationalId || undefined,
          expectedReleaseDate: expectedReleaseDate?.toISOString(),
        });
        qc.invalidateQueries({ queryKey: ['prisoners', 'detail', editId] });
        Toast.show({ type: 'success', text1: 'Prisoner updated' });
      } else {
        await prisonersApi.create({
          prisonId,
          prisonerNumber: prisonerNumber.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender,
          nationalId: nationalId || undefined,
          cellBlock: cellBlock || undefined,
          cellNumber: cellNumber || undefined,
          admissionDate: admissionDate!.toISOString(),
          expectedReleaseDate: expectedReleaseDate?.toISOString(),
          offenseCategory: offenseCategory || undefined,
        });
        Toast.show({ type: 'success', text1: 'Prisoner registered' });
      }
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PRISONERS });
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
      <ScreenHeader title={isEdit ? 'Edit Prisoner' : 'Register Prisoner'} onBack={() => navigation.goBack()} />

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

            <Input label="Prisoner Number *" value={prisonerNumber} onChangeText={setPrisonerNumber} leftIcon="barcode-outline" placeholder="e.g. KGL-2026-0001" />

            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>Gender *</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGender(g)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                    backgroundColor: gender === g ? COLORS.primary : COLORS.white,
                    borderWidth: 1.5, borderColor: gender === g ? COLORS.primary : COLORS.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: gender === g ? COLORS.white : COLORS.text }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <DateField
              label="Admission Date"
              required
              value={admissionDate}
              onChange={setAdmissionDate}
              maximumDate={new Date()}
            />
          </>
        )}

        <Input label="First Name *" value={firstName} onChangeText={setFirstName} leftIcon="person-outline" />
        <Input label="Last Name *" value={lastName} onChangeText={setLastName} leftIcon="person-outline" />
        <Input label="National ID" value={nationalId} onChangeText={setNationalId} leftIcon="card-outline" />
        <Input label="Cell Block" value={cellBlock} onChangeText={setCellBlock} leftIcon="grid-outline" />
        <Input label="Cell Number" value={cellNumber} onChangeText={setCellNumber} leftIcon="grid-outline" />
        <Input label="Offense Category" value={offenseCategory} onChangeText={setOffenseCategory} leftIcon="document-text-outline" hint="Broad category only, for administrative use" />
        <DateField
          label="Expected Release Date"
          value={expectedReleaseDate}
          onChange={setExpectedReleaseDate}
          minimumDate={new Date()}
        />

        <Button
          title={isEdit ? 'Save Changes' : 'Register Prisoner'}
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </View>
  );
};
