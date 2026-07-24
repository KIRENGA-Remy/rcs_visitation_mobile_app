import React, { useState } from 'react';
import { View, Text, FlatList, StatusBar, RefreshControl, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { visitorsApi, ContactRequest } from '@api/visitors';
import { extractApiError } from '@utils';

export const ContactRequestsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<ContactRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['visitors', 'contact-requests', 'pending'],
    queryFn: () => visitorsApi.getPendingContactRequests({ limit: 50 }),
  });

  const handleApprove = async (item: ContactRequest) => {
    setProcessingId(item.id);
    try {
      await visitorsApi.approveContactRequest(item.id);
      Toast.show({ type: 'success', text1: 'Contact Approved', text2: 'Visitor may now book a visit' });
      qc.invalidateQueries({ queryKey: ['visitors', 'contact-requests', 'pending'] });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Approval Failed', text2: extractApiError(err) });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      Toast.show({ type: 'error', text1: 'Please provide a reason' });
      return;
    }
    setProcessingId(rejectTarget.id);
    try {
      await visitorsApi.rejectContactRequest(rejectTarget.id, rejectReason.trim());
      Toast.show({ type: 'success', text1: 'Contact Request Rejected' });
      qc.invalidateQueries({ queryKey: ['visitors', 'contact-requests', 'pending'] });
      setRejectTarget(null);
      setRejectReason('');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Rejection Failed', text2: extractApiError(err) });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title="Contact Requests"
        subtitle={`${data?.data?.length ?? 0} awaiting review`}
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-done-outline"
              title="No pending requests"
              description="All visitor contact requests have been reviewed."
            />
          }
          renderItem={({ item }) => (
            <Card variant="elevated" style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 15 }}>
                {item.visitorProfile?.user?.firstName} {item.visitorProfile?.user?.lastName}
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                {item.visitorProfile?.user?.phone}
                {item.visitorProfile?.user?.nationalId ? ` · NID ${item.visitorProfile.user.nationalId}` : ''}
              </Text>
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 10 }} />
              <Text style={{ color: COLORS.text, fontSize: 13 }}>
                Wants to visit <Text style={{ fontWeight: '700' }}>{item.prisoner.firstName} {item.prisoner.lastName}</Text>
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                #{item.prisoner.prisonerNumber} · {item.prisoner.prison.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: `${COLORS.info}15` }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.info }}>{item.relationship}</Text>
                </View>
              </View>
              {item.notes && (
                <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
                  "{item.notes}"
                </Text>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Button
                  title="Approve"
                  onPress={() => handleApprove(item)}
                  loading={processingId === item.id}
                  style={{ flex: 1, backgroundColor: COLORS.success }}
                />
                <Button
                  title="Reject"
                  onPress={() => { setRejectTarget(item); setRejectReason(''); }}
                  variant="outline"
                  style={{ flex: 1, borderColor: COLORS.error }}
                  textStyle={{ color: COLORS.error }}
                />
              </View>
            </Card>
          )}
        />
      )}

      {/* Reject reason modal */}
      <Modal visible={!!rejectTarget} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '88%' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 6 }}>Reject Request</Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 14 }}>
              This reason will be visible to the visitor.
            </Text>
            <View style={{ borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <TextInput
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="e.g. Relationship could not be verified"
                placeholderTextColor={COLORS.textLight}
                multiline
                style={{ minHeight: 70, fontSize: 14, color: COLORS.text }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancel" onPress={() => setRejectTarget(null)} variant="outline" style={{ flex: 1 }} />
              <Button
                title="Confirm Reject"
                onPress={handleReject}
                loading={processingId === rejectTarget?.id}
                style={{ flex: 1, backgroundColor: COLORS.error }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
