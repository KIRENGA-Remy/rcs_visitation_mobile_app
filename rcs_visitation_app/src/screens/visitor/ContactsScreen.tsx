import React, { useCallback } from 'react';
import { View, Text, FlatList, StatusBar, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@components/common/Card';
import { EmptyState } from '@components/common/EmptyState';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { VisitRequestSkeleton } from '@components/common/Skeleton';
import { COLORS, QUERY_KEYS } from '@constants';
import { visitorsApi } from '@api/visitors';
import { useTranslation } from '@hooks/useTranslation';
import type { VisitorProfile } from '@types';

export const ContactsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const { data: profile, isLoading, refetch, isRefetching } = useQuery<VisitorProfile>({
    queryKey: QUERY_KEYS.MY_VISITOR,
    queryFn: visitorsApi.getMyProfile,
  });

  const contacts = profile?.approvedPrisoners ?? [];

  const renderItem = useCallback(({ item }: { item: NonNullable<VisitorProfile['approvedPrisoners']>[number] }) => (
    <Card variant="elevated" style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: `${COLORS.primary}12`,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="person" size={20} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
            {item.prisoner.lastName}, {item.prisoner.firstName}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
            {t('id_label')}: {item.prisoner.prisonerNumber}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
            {item.prisoner.prison?.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <View style={{
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
              backgroundColor: `${COLORS.info}15`,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.info }}>
                {item.relationship}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success }} />
              <Text style={{ fontSize: 11, color: COLORS.success, fontWeight: '600' }}>{t('active')}</Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  ), [t]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title={t('my_contacts')}
        subtitle={`${contacts.length} ${t('approved').toLowerCase()}`}
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            onPress={() => navigation.navigate('RequestVisit')}
            style={{ padding: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('request_visit')}
          >
            <Ionicons name="add" size={26} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3].map((i) => <VisitRequestSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={t('no_contacts')}
              description={t('no_contacts_desc')}
              actionLabel={t('request_visit')}
              onAction={() => navigation.navigate('RequestVisit')}
            />
          }
        />
      )}
    </View>
  );
};
