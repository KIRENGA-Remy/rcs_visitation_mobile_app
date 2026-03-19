import React, { useState } from 'react';
import {
  View, Text, ScrollView, StatusBar, TouchableOpacity, Alert, Modal, Image
} from 'react-native';
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
import { useCancelRequest } from '@hooks/useVisitRequests';
import { formatDate, formatTime, formatDateTime, extractApiError } from '@utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { VisitorStackParamList } from '@navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<VisitorStackParamList, 'RequestDetail'>;
  route: { params: { id: string } };
};

export const RequestDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason]   = useState('');

  const { data: request, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.VISIT_REQUEST(id),
    queryFn: () => visitRequestsApi.get(id),
  });

  const { mutate: cancelRequest, isPending: isCancelling } = useCancelRequest();

  if (isLoading || !request) return <LoadingScreen />;

  const canCancel = ['PENDING', 'APPROVED'].includes(request.status);
  const isApproved = request.status === 'APPROVED';

  const handleCancel = () => {
    if (!cancelReason.trim() || cancelReason.length < 5) {
      Toast.show({ type: 'error', text1: 'Please provide a reason (min 5 characters)' });
      return;
    }
    cancelRequest({ id, reason: cancelReason }, {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: 'Request Cancelled' });
        setCancelModalVisible(false);
        refetch();
      },
      onError: (err) => Toast.show({ type: 'error', text1: extractApiError(err) }),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title="Visit Request"
        subtitle={`Ref: ${request.referenceNumber?.toUpperCase().slice(0, 10)}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Status banner */}
        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>Status</Text>
            <StatusBadge status={request.status} />
          </View>
          {request.rejectionReason && (
            <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12 }}>
              <Text style={{ color: '#991B1B', fontWeight: '600', marginBottom: 4 }}>Rejection Reason</Text>
              <Text style={{ color: '#991B1B', fontSize: 13 }}>{request.rejectionReason}</Text>
            </View>
          )}
        </Card>

        {/* QR Code for approved requests */}
        {isApproved && request.qrCode && (
          <Card variant="elevated" style={{ marginBottom: 16, alignItems: 'center' }}>
            <Ionicons name="qr-code" size={80} color={COLORS.primary} />
            <Text style={{ marginTop: 12, fontWeight: '700', fontSize: 16, color: COLORS.text }}>Your Entry QR Code</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
              Show this at the prison gate. Expires: {request.qrCodeExpiresAt ? formatDateTime(request.qrCodeExpiresAt) : '—'}
            </Text>
            <View style={{ marginTop: 12, backgroundColor: COLORS.surface, borderRadius: 8, padding: 12 }}>
              <Text style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: COLORS.primary, letterSpacing: 2 }}>
                {request.qrCode}
              </Text>
            </View>
          </Card>
        )}

        {/* Prisoner info */}
        {request.prisoner && (
          <Card variant="elevated" style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Visiting</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: `${COLORS.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
                  {request.prisoner.firstName} {request.prisoner.lastName}
                </Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>#{request.prisoner.prisonerNumber}</Text>
                {request.prisoner.cellBlock && (
                  <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>Cell: {request.prisoner.cellBlock}</Text>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Schedule */}
        {request.schedule && (
          <Card variant="elevated" style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Schedule</Text>
            <InfoRow icon="calendar" label="Date" value={formatDate(request.schedule.startTime)} />
            <InfoRow icon="time" label="Time" value={`${formatTime(request.schedule.startTime)} – ${formatTime(request.schedule.endTime)}`} />
            {request.schedule.prison && <InfoRow icon="business" label="Prison" value={request.schedule.prison.name} />}
          </Card>
        )}

        {/* Visit details */}
        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Visit Details</Text>
          <InfoRow icon="people" label="Adults" value={String(request.numberOfAdults)} />
          <InfoRow icon="happy" label="Children" value={String(request.numberOfChildren)} />
          <InfoRow icon="briefcase" label="Type" value={VISIT_TYPE_LABELS[request.visitType]} />
          {request.purposeNote && <InfoRow icon="document-text" label="Purpose" value={request.purposeNote} />}
          <InfoRow icon="time" label="Requested" value={formatDateTime(request.createdAt)} />
        </Card>

        {/* Visit Log */}
        {request.visitLog && (
          <Card variant="elevated" style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Visit Record</Text>
            <InfoRow icon="enter" label="Checked In" value={formatDateTime(request.visitLog.actualCheckinTime)} />
            {request.visitLog.actualCheckoutTime && (
              <InfoRow icon="exit" label="Checked Out" value={formatDateTime(request.visitLog.actualCheckoutTime)} />
            )}
            {request.visitLog.durationMinutes && (
              <InfoRow icon="stopwatch" label="Duration" value={`${request.visitLog.durationMinutes} minutes`} />
            )}
          </Card>
        )}

        {/* Cancel button */}
        {canCancel && (
          <Button
            title="Cancel Request"
            onPress={() => setCancelModalVisible(true)}
            variant="danger"
            style={{ marginTop: 8 }}
          />
        )}
      </ScrollView>

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="slide" onRequestClose={() => setCancelModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay }}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Cancel Request</Text>
            <Text style={{ color: COLORS.textMuted, marginBottom: 20 }}>Please provide a reason for cancellation.</Text>
            <View style={{ borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <Text
                onPress={() => {}}
                style={{ color: cancelReason ? COLORS.text : COLORS.textLight, fontSize: 14 }}
              />
              <TouchableOpacity>
                <View>
                  {['Changed my plans', 'Emergency', 'Scheduling conflict', 'Other'].map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      onPress={() => setCancelReason(reason)}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 }}
                    >
                      <Ionicons name={cancelReason === reason ? 'radio-button-on' : 'radio-button-off'} size={20} color={cancelReason === reason ? COLORS.primary : COLORS.textMuted} />
                      <Text style={{ fontSize: 15, color: COLORS.text }}>{reason}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button title="Keep Request" onPress={() => setCancelModalVisible(false)} variant="outline" style={{ flex: 1 }} />
              <Button title="Cancel Visit" onPress={handleCancel} variant="danger" loading={isCancelling} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
    <Ionicons name={`${icon}-outline` as any} size={16} color={COLORS.textMuted} style={{ marginTop: 2 }} />
    <Text style={{ fontSize: 13, color: COLORS.textMuted, width: 80 }}>{label}</Text>
    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 }}>{value}</Text>
  </View>
);
