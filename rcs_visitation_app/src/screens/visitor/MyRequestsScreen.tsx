import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StatusBar, RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { VisitRequestSkeleton } from '@components/common/Skeleton';
import { EmptyState } from '@components/common/EmptyState';
import { VisitRequestCard } from '@components/common/VisitRequestCard';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { useMyRequests } from '@hooks/useVisitRequests';
import { useTranslation } from '@hooks/useTranslation';
import type { VisitRequest } from '@types';

export const MyRequestsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data, isLoading, refetch, isRefetching } = useMyRequests({ status: filter });

  const FILTERS = [
    { label: t('all'),       value: undefined },
    { label: t('PENDING'),   value: 'PENDING' },
    { label: t('APPROVED'),  value: 'APPROVED' },
    { label: t('COMPLETED'), value: 'COMPLETED' },
    { label: t('REJECTED'),  value: 'REJECTED' },
  ];

  const handlePress = useCallback((id: string) => {
    navigation.navigate('RequestDetail', { id });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: VisitRequest }) => (
    <VisitRequestCard request={item} onPress={() => handlePress(item.id)} />
  ), [handlePress]);

  const keyExtractor = useCallback((item: VisitRequest) => item.id, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title={t('my_requests')}
        subtitle={`${data?.data?.length ?? 0} ${t('visit_request').toLowerCase()}s`}
        onBack={() => navigation.goBack()}
      />

      {/* Filter tabs */}
      <View style={{ backgroundColor: COLORS.white, paddingVertical: 12 }}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item.value }}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
                backgroundColor: filter === item.value ? COLORS.primary : COLORS.surface,
                borderWidth: 1.5,
                borderColor: filter === item.value ? COLORS.primary : COLORS.border,
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: '600',
                color: filter === item.value ? COLORS.white : COLORS.textMuted,
              }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={{ padding: 16 }}>
          {[1,2,3].map(i => <VisitRequestSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={t('no_requests')}
              description={filter ? `No ${filter.toLowerCase()} requests` : 'Book your first visit to get started.'}
              actionLabel={!filter ? t('book_visit') : undefined}
              onAction={!filter ? () => navigation.navigate('BookVisit') : undefined}
            />
          }
        />
      )}
    </View>
  );
};
