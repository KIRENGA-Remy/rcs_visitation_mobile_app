import React, { useState } from 'react';
import {
  View, Text, FlatList, StatusBar, RefreshControl,
  TouchableOpacity, TextInput, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Avatar } from '@components/common/Avatar';
import { StatusBadge } from '@components/common/StatusBadge';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { EmptyState } from '@components/common/EmptyState';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS } from '@constants';
import { usersApi } from '@api/users';
import { extractApiError } from '@utils';

const ROLE_TABS = [
  { label: 'All',     value: undefined },
  { label: 'Visitors',value: 'VISITOR' },
  { label: 'Officers',value: 'PRISON_OFFICER' },
  { label: 'Admins',  value: 'ADMIN' },
];

export const UsersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [...QUERY_KEYS.USERS, { role, search }],
    queryFn:  () => usersApi.list({ role, search: search || undefined, limit: 50 }),
    staleTime: 30 * 1000,
  });

  const handleToggleStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    Alert.alert(
      `${newStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'} User`,
      `Are you sure you want to ${newStatus === 'SUSPENDED' ? 'suspend' : 'activate'} this account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus === 'SUSPENDED' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await usersApi.updateStatus(userId, newStatus);
              qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
              Toast.show({ type: 'success', text1: `User ${newStatus === 'SUSPENDED' ? 'suspended' : 'activated'}` });
            } catch (err: any) {
              Toast.show({ type: 'error', text1: extractApiError(err) });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title="Users"
        subtitle={`${data?.data?.length ?? 0} accounts`}
        onBack={() => navigation.goBack()}
      />

      {/* Search */}
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
          <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
          <TextInput
            value={searchText}
            onChangeText={(t) => { setSearchText(t); if (t.length === 0 || t.length > 2) setSearch(t); }}
            placeholder="Search by name, email, phone..."
            placeholderTextColor={COLORS.textLight}
            style={{ flex: 1, fontSize: 14, color: COLORS.text }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); setSearch(''); }}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Role tabs */}
      <View style={{ backgroundColor: COLORS.white, paddingBottom: 10 }}>
        <FlatList
          horizontal
          data={ROLE_TABS}
          keyExtractor={(t) => t.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setRole(item.value)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
                backgroundColor: role === item.value ? COLORS.primary : COLORS.surface,
                borderWidth: 1.5,
                borderColor: role === item.value ? COLORS.primary : COLORS.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: role === item.value ? COLORS.white : COLORS.textMuted }}>
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
          ListEmptyComponent={
            <EmptyState icon="people-outline" title="No users found" description="Try adjusting your search filters" />
          }
          renderItem={({ item }) => (
            <View style={{
              backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
              marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
            }}>
              <Avatar firstName={item.firstName} lastName={item.lastName} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{item.email}</Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{item.phone}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  <StatusBadge status={item.role} label={item.role.replace('_', ' ')} size="sm" />
                  <StatusBadge status={item.status} size="sm" />
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleToggleStatus(item.id, item.status)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: item.status === 'ACTIVE' ? '#FEF2F2' : '#F0FDF4',
                }}
              >
                <Ionicons
                  name={item.status === 'ACTIVE' ? 'ban-outline' : 'checkmark-circle-outline'}
                  size={20}
                  color={item.status === 'ACTIVE' ? COLORS.error : COLORS.success}
                />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};
