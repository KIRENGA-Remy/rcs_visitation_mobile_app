import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { StatusBadge } from '@components/common/StatusBadge';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS } from '@constants';
import { prisonersApi } from '@api/prisoners';
import { prisonsApi } from '@api/prisons';
import { extractApiError, formatDate } from '@utils';
import type { AdminStackParamList } from '@navigation/types';

type ModalType = 'transfer' | 'restrict' | 'release' | null;

export const PrisonerDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AdminStackParamList, 'PrisonerDetail'>>();
  const { id } = route.params;
  const qc = useQueryClient();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [processing, setProcessing] = useState(false);
  const [transferPrisonId, setTransferPrisonId] = useState('');
  const [reason, setReason] = useState('');

  const { data: prisoner, isLoading, refetch } = useQuery({
    queryKey: ['prisoners', 'detail', id],
    queryFn: () => prisonersApi.get(id),
  });

  const { data: prisonsData } = useQuery({
    queryKey: ['prisons', 'all'],
    queryFn: () => prisonsApi.list({ limit: 100 }),
    enabled: activeModal === 'transfer',
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['prisoners', 'detail', id] });
    qc.invalidateQueries({ queryKey: QUERY_KEYS.PRISONERS });
  };

  const closeModal = () => { setActiveModal(null); setReason(''); setTransferPrisonId(''); };

  const handleTransfer = async () => {
    if (!transferPrisonId) { Toast.show({ type: 'error', text1: 'Select a destination prison' }); return; }
    setProcessing(true);
    try {
      await prisonersApi.transfer(id, { newPrisonId: transferPrisonId, transferNotes: reason || undefined });
      Toast.show({ type: 'success', text1: 'Prisoner transferred' });
      invalidate(); closeModal();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Transfer failed', text2: extractApiError(err) });
    } finally { setProcessing(false); }
  };

  const handleToggleRestrict = async () => {
    const willRestrict = !prisoner?.visitingRestricted;
    if (willRestrict && !reason.trim()) {
      Toast.show({ type: 'error', text1: 'Please provide a restriction reason' });
      return;
    }
    setProcessing(true);
    try {
      await prisonersApi.restrict(id, { restricted: willRestrict, restrictionReason: willRestrict ? reason.trim() : undefined });
      Toast.show({ type: 'success', text1: willRestrict ? 'Visits restricted' : 'Restriction lifted' });
      invalidate(); closeModal();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: extractApiError(err) });
    } finally { setProcessing(false); }
  };

  const handleRelease = async () => {
    setProcessing(true);
    try {
      await prisonersApi.release(id, reason || undefined);
      Toast.show({ type: 'success', text1: 'Prisoner marked as released' });
      invalidate(); closeModal();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Action failed', text2: extractApiError(err) });
    } finally { setProcessing(false); }
  };

  const handleReactivate = () => {
    Alert.alert('Reactivate Prisoner', 'Set this prisoner\'s status back to Active?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reactivate',
        onPress: async () => {
          try {
            await prisonersApi.reactivate(id);
            Toast.show({ type: 'success', text1: 'Prisoner reactivated' });
            invalidate();
          } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Action failed', text2: extractApiError(err) });
          }
        },
      },
    ]);
  };

  if (isLoading || !prisoner) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title={`${prisoner.firstName} ${prisoner.lastName}`}
        subtitle={`#${prisoner.prisonerNumber}`}
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            onPress={() => navigation.navigate('PrisonerForm', { id })}
            style={{ padding: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Edit prisoner"
          >
            <Ionicons name="create-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <StatusBadge status={prisoner.status} />
          {prisoner.visitingRestricted && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: COLORS.error, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="ban-outline" size={12} color={COLORS.error} />
              <Text style={{ fontSize: 11, color: COLORS.error, fontWeight: '700' }}>VISITS RESTRICTED</Text>
            </View>
          )}
        </View>

        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase' }}>
            Details
          </Text>
          {[
            { label: 'Facility', value: prisoner.prison.name },
            { label: 'Cell', value: [prisoner.cellBlock, prisoner.cellNumber].filter(Boolean).join(' / ') || '—' },
            { label: 'Gender', value: prisoner.gender },
            { label: 'Admitted', value: formatDate(prisoner.admissionDate) },
            { label: 'National ID', value: prisoner.nationalId ?? '—' },
            { label: 'Total Visits', value: String(prisoner.totalVisitsReceived) },
          ].map((row) => (
            <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, color: COLORS.textMuted }}>{row.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text }}>{row.value}</Text>
            </View>
          ))}
          {prisoner.restrictionReason && (
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <Text style={{ fontSize: 12, color: COLORS.error, fontStyle: 'italic' }}>
                Restriction reason: {prisoner.restrictionReason}
              </Text>
            </View>
          )}
          {prisoner.status === 'RELEASED' && prisoner.releaseNotes && (
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' }}>
                Release notes: {prisoner.releaseNotes}
              </Text>
            </View>
          )}
        </Card>

        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 10, textTransform: 'uppercase' }}>
          Actions
        </Text>
        <View style={{ gap: 10 }}>
          <Button
            title="Transfer to Another Prison"
            onPress={() => setActiveModal('transfer')}
            variant="outline"
            leftIcon={<Ionicons name="swap-horizontal-outline" size={18} color={COLORS.primary} />}
          />
          <Button
            title={prisoner.visitingRestricted ? 'Lift Visit Restriction' : 'Restrict Visits'}
            onPress={() => setActiveModal('restrict')}
            variant="outline"
            style={{ borderColor: COLORS.warning }}
            textStyle={{ color: COLORS.warning }}
            leftIcon={<Ionicons name="ban-outline" size={18} color={COLORS.warning} />}
          />
          {prisoner.status === 'ACTIVE' ? (
            <Button
              title="Mark as Released"
              onPress={() => setActiveModal('release')}
              variant="outline"
              style={{ borderColor: COLORS.error }}
              textStyle={{ color: COLORS.error }}
              leftIcon={<Ionicons name="exit-outline" size={18} color={COLORS.error} />}
            />
          ) : (
            <Button
              title="Reactivate (set to Active)"
              onPress={handleReactivate}
              variant="outline"
              style={{ borderColor: COLORS.success }}
              textStyle={{ color: COLORS.success }}
              leftIcon={<Ionicons name="checkmark-circle-outline" size={18} color={COLORS.success} />}
            />
          )}
        </View>
      </ScrollView>

      {/* Transfer modal */}
      <Modal visible={activeModal === 'transfer'} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '88%', maxHeight: '75%' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 14 }}>Transfer Prisoner</Text>
            <ScrollView style={{ maxHeight: 220, marginBottom: 12 }}>
              {prisonsData?.data?.filter((p) => p.id !== prisoner.prisonId).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setTransferPrisonId(p.id)}
                  style={{
                    padding: 12, borderRadius: 10, marginBottom: 6,
                    backgroundColor: transferPrisonId === p.id ? `${COLORS.primary}15` : COLORS.surface,
                    borderWidth: 1.5, borderColor: transferPrisonId === p.id ? COLORS.primary : COLORS.border,
                  }}
                >
                  <Text style={{ fontWeight: '600', color: COLORS.text }}>{p.name}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{p.district}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Transfer notes (optional)"
              placeholderTextColor={COLORS.textLight}
              style={{ borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancel" onPress={closeModal} variant="outline" style={{ flex: 1 }} />
              <Button title="Confirm" onPress={handleTransfer} loading={processing} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Restrict modal */}
      <Modal visible={activeModal === 'restrict'} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '88%' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 6 }}>
              {prisoner.visitingRestricted ? 'Lift Visit Restriction' : 'Restrict Visits'}
            </Text>
            {!prisoner.visitingRestricted && (
              <>
                <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>A reason is required.</Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. Ongoing disciplinary review"
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  style={{ borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 16, minHeight: 70, fontSize: 13 }}
                />
              </>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: prisoner.visitingRestricted ? 12 : 0 }}>
              <Button title="Cancel" onPress={closeModal} variant="outline" style={{ flex: 1 }} />
              <Button title="Confirm" onPress={handleToggleRestrict} loading={processing} style={{ flex: 1, backgroundColor: COLORS.warning }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Release modal */}
      <Modal visible={activeModal === 'release'} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '88%' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 6 }}>Mark as Released</Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>
              Any pending or approved visits for this prisoner will be cancelled.
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Release notes (optional)"
              placeholderTextColor={COLORS.textLight}
              style={{ borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13 }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancel" onPress={closeModal} variant="outline" style={{ flex: 1 }} />
              <Button title="Confirm Release" onPress={handleRelease} loading={processing} style={{ flex: 1, backgroundColor: COLORS.error }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
