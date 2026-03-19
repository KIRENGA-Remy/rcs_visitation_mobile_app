import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { StatusBadge } from '@components/common/StatusBadge';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS, VISIT_TYPE_LABELS } from '@constants';
import { visitRequestsApi } from '@api/visitRequests';
import { useProcessRequest } from '@hooks/useVisitRequests';
import { formatDate, formatTime, extractApiError } from '@utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params: { id: string } };
};

export const ReviewRequestScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: request, isLoading } = useQuery({
    queryKey: QUERY_KEYS.VISIT_REQUEST(id),
    queryFn: () => visitRequestsApi.get(id),
  });

  const { mutate: process, isPending } = useProcessRequest();

  if (isLoading || !request) return <LoadingScreen />;

  const handleApprove = () => {
    process({ id, action: 'APPROVE' }, {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: '✓ Request Approved', text2: 'QR code has been generated' });
        navigation.goBack();
      },
      onError: (err) => Toast.show({ type: 'error', text1: extractApiError(err) }),
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      Toast.show({ type: 'error', text1: 'Please provide a rejection reason' });
      return;
    }
    process({ id, action: 'REJECT', rejectionReason }, {
      onSuccess: () => {
        Toast.show({ type: 'info', text1: 'Request Rejected' });
        setRejectModalVisible(false);
        navigation.goBack();
      },
      onError: (err) => Toast.show({ type: 'error', text1: extractApiError(err) }),
    });
  };

  const isPending_ = request.status === 'PENDING';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title="Review Request" subtitle="Approve or reject visit" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Status */}
        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '700', color: COLORS.text }}>Status</Text>
            <StatusBadge status={request.status} />
          </View>
          <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6 }}>
            Ref: {request.referenceNumber?.toUpperCase()}
          </Text>
        </Card>

        {/* Visitor Info */}
        {request.visitorProfile && (
          <Card variant="elevated" style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Visitor</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${COLORS.info}15`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person" size={24} color={COLORS.info} />
              </View>
              <View>
                <Text style={{ fontWeight: '700', fontSize: 16, color: COLORS.text }}>
                  {request.visitorProfile.user.firstName} {request.visitorProfile.user.lastName}
                </Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>{request.visitorProfile.user.phone}</Text>
                {request.visitorProfile.user.nationalId && (
                  <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>NID: {request.visitorProfile.user.nationalId}</Text>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Prisoner */}
        {request.prisoner && (
          <Card variant="elevated" style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prisoner</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
              {request.prisoner.firstName} {request.prisoner.lastName}
            </Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 2 }}>
              #{request.prisoner.prisonerNumber}
              {request.prisoner.cellBlock ? ` · Cell ${request.prisoner.cellBlock}` : ''}
            </Text>
          </Card>
        )}

        {/* Schedule */}
        {request.schedule && (
          <Card variant="elevated" style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Scheduled Time</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="calendar" size={18} color={COLORS.primary} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>
                {formatDate(request.schedule.startTime)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <Ionicons name="time" size={18} color={COLORS.primary} />
              <Text style={{ color: COLORS.text }}>
                {formatTime(request.schedule.startTime)} – {formatTime(request.schedule.endTime)}
              </Text>
            </View>
          </Card>
        )}

        {/* Details */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Details</Text>
          {[
            { label: 'Visit Type', value: VISIT_TYPE_LABELS[request.visitType] },
            { label: 'Adults',     value: String(request.numberOfAdults) },
            { label: 'Children',   value: String(request.numberOfChildren) },
            { label: 'Notes',      value: request.purposeNote ?? '—' },
          ].map((row) => (
            <View key={row.label} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Text style={{ width: 90, color: COLORS.textMuted, fontSize: 13 }}>{row.label}</Text>
              <Text style={{ fontWeight: '600', color: COLORS.text, fontSize: 13, flex: 1 }}>{row.value}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Action buttons (only when pending) */}
      {isPending_ && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 20, paddingBottom: 32, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', gap: 12 }}>
          <Button
            title="Reject"
            onPress={() => setRejectModalVisible(true)}
            variant="danger"
            style={{ flex: 1 }}
          />
          <Button
            title="Approve"
            onPress={handleApprove}
            loading={isPending}
            style={{ flex: 2 }}
          />
        </View>
      )}

      {/* Rejection Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay }}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Reject Request</Text>
            <Text style={{ color: COLORS.textMuted, marginBottom: 16 }}>Provide a reason for rejection</Text>
            {['Missing documentation', 'Security concern', 'Visitor banned', 'Prisoner restricted', 'Other'].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRejectionReason(r)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
              >
                <Ionicons name={rejectionReason === r ? 'radio-button-on' : 'radio-button-off'} size={20} color={rejectionReason === r ? COLORS.primary : COLORS.textMuted} />
                <Text style={{ fontSize: 15, color: COLORS.text, marginLeft: 12 }}>{r}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <Button title="Cancel" onPress={() => setRejectModalVisible(false)} variant="outline" style={{ flex: 1 }} />
              <Button title="Reject" onPress={handleReject} variant="danger" loading={isPending} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
