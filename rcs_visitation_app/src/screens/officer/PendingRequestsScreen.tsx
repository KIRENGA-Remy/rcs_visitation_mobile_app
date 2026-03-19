import React, { useState } from 'react';
import {
  View, Text, FlatList, StatusBar, RefreshControl, TouchableOpacity, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { VisitRequestCard } from '@components/common/VisitRequestCard';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { EmptyState } from '@components/common/EmptyState';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { visitRequestsApi } from '@api/visitRequests';

const STATUS_TABS = [
  { label: 'Pending',   value: 'PENDING' },
  { label: 'Approved',  value: 'APPROVED' },
  { label: 'Today',     value: 'CHECKED_IN' },
  { label: 'Completed', value: 'COMPLETED' },
];

export const PendingRequestsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('PENDING');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['visit-requests', 'prison-all', activeTab],
    queryFn:  () => visitRequestsApi.byPrison('', { status: activeTab, limit: 50 }),
    staleTime: 30 * 1000,
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title="Visit Requests"
        subtitle={`${data?.data?.length ?? 0} requests`}
        onBack={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={{ backgroundColor: COLORS.white, paddingVertical: 10 }}>
        <FlatList
          horizontal
          data={STATUS_TABS}
          keyExtractor={(t) => t.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveTab(item.value)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: activeTab === item.value ? COLORS.primary : COLORS.surface,
                borderWidth: 1.5,
                borderColor: activeTab === item.value ? COLORS.primary : COLORS.border,
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: activeTab === item.value ? COLORS.white : COLORS.textMuted,
              }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

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
              icon="document-outline"
              title="No requests"
              description={`No ${activeTab.toLowerCase()} requests at this time`}
            />
          }
          renderItem={({ item }) => (
            <VisitRequestCard
              request={item}
              showVisitor
              onPress={() => {
                if (item.status === 'PENDING') {
                  navigation.navigate('ReviewRequest', { id: item.id });
                } else if (item.status === 'APPROVED') {
                  navigation.navigate('CheckIn', { visitRequestId: item.id });
                } else if (item.status === 'CHECKED_IN') {
                  navigation.navigate('CheckOut', { visitRequestId: item.id });
                } else {
                  navigation.navigate('ReviewRequest', { id: item.id });
                }
              }}
            />
          )}
        />
      )}
    </View>
  );
};
