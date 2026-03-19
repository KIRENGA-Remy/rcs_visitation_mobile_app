import React, { useState } from 'react';
import {
  View, Text, FlatList, StatusBar, RefreshControl, TouchableOpacity, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '@components/common/StatusBadge';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { EmptyState } from '@components/common/EmptyState';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS } from '@constants';
import { prisonersApi } from '@api/prisoners';

export const PrisonersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [search, setSearch]     = useState('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [...QUERY_KEYS.PRISONERS, { search, statusFilter }],
    queryFn:  () => prisonersApi.list({ search: search || undefined, status: statusFilter, limit: 50 }),
    staleTime: 30 * 1000,
  });

  const STATUS_TABS = [
    { label: 'All',         value: undefined },
    { label: 'Active',      value: 'ACTIVE' },
    { label: 'Transferred', value: 'TRANSFERRED' },
    { label: 'Restricted',  value: 'RESTRICTED' },
    { label: 'Released',    value: 'RELEASED' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title="Prisoners"
        subtitle={`${data?.data?.length ?? 0} records`}
        onBack={() => navigation.goBack()}
      />

      {/* Search */}
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
          <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
          <TextInput
            value={searchText}
            onChangeText={(t) => { setSearchText(t); if (t.length === 0 || t.length > 2) setSearch(t); }}
            placeholder="Search by name or prisoner number..."
            placeholderTextColor={COLORS.textLight}
            style={{ flex: 1, fontSize: 14, color: COLORS.text }}
          />
        </View>
      </View>

      {/* Status tabs */}
      <View style={{ backgroundColor: COLORS.white, paddingBottom: 10 }}>
        <FlatList
          horizontal data={STATUS_TABS} keyExtractor={(t) => t.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setStatus(item.value)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
                backgroundColor: statusFilter === item.value ? COLORS.primary : COLORS.surface,
                borderWidth: 1.5,
                borderColor: statusFilter === item.value ? COLORS.primary : COLORS.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: statusFilter === item.value ? COLORS.white : COLORS.textMuted }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? <LoadingScreen /> : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState icon="person-outline" title="No prisoners found" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {}}
              style={{
                backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
                marginBottom: 10,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                    #{item.prisonerNumber}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <Ionicons name="business-outline" size={13} color={COLORS.textMuted} />
                    <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>
                      {item.prison.name}
                      {item.cellBlock ? ` · ${item.cellBlock}` : ''}
                    </Text>
                  </View>
                </View>
                <View style={{ gap: 6, alignItems: 'flex-end' }}>
                  <StatusBadge status={item.status} size="sm" />
                  {item.visitingRestricted && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="ban-outline" size={12} color={COLORS.error} />
                      <Text style={{ fontSize: 11, color: COLORS.error, fontWeight: '600' }}>Restricted</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="people-outline" size={13} color={COLORS.textMuted} />
                  <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                    {item.totalVisitsReceived} visits
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                  <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                    Admitted {new Date(item.admissionDate).getFullYear()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};
