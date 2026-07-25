import React, { useState } from 'react';
import {
  View, Text, FlatList, StatusBar, RefreshControl,
  TouchableOpacity, TextInput, Alert, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Avatar } from '@components/common/Avatar';
import { Button } from '@components/common/Button';
import { StatusBadge } from '@components/common/StatusBadge';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { EmptyState } from '@components/common/EmptyState';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS } from '@constants';
import { usersApi } from '@api/users';
import { prisonsApi } from '@api/prisons';
import { extractApiError } from '@utils';
import type { UserAdmin } from '@types';

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
  const [assignTarget, setAssignTarget] = useState<UserAdmin | null>(null);
  const [assigning, setAssigning] = useState(false);

  const { data: prisonsData } = useQuery({
    queryKey: ['prisons', 'all'],
    queryFn: () => prisonsApi.list({ limit: 100 }),
    enabled: !!assignTarget,
  });

  const handleAssignPrison = async (prisonId: string | null) => {
    if (!assignTarget) return;
    setAssigning(true);
    try {
      await usersApi.assignPrison(assignTarget.id, prisonId);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      Toast.show({ type: 'success', text1: prisonId ? 'Officer assigned' : 'Officer unassigned' });
      setAssignTarget(null);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Assignment failed', text2: extractApiError(err) });
    } finally {
      setAssigning(false);
    }
  };

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
                {item.role === 'PRISON_OFFICER' && (
                  <TouchableOpacity
                    onPress={() => setAssignTarget(item)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}
                  >
                    <Ionicons name="business-outline" size={12} color={COLORS.primary} />
                    <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>
                      {item.assignedPrison?.name ?? 'Assign facility'}
                    </Text>
                  </TouchableOpacity>
                )}
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

      {/* Assign facility modal */}
      <Modal visible={!!assignTarget} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: 24, width: '88%', maxHeight: '75%' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 4 }}>
              Assign Facility
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 14 }}>
              {assignTarget?.firstName} {assignTarget?.lastName}
            </Text>
            <FlatList
              data={prisonsData?.data ?? []}
              keyExtractor={(p) => p.id}
              style={{ maxHeight: 220, marginBottom: 12 }}
              renderItem={({ item: p }) => (
                <TouchableOpacity
                  onPress={() => handleAssignPrison(p.id)}
                  style={{
                    padding: 12, borderRadius: 10, marginBottom: 6,
                    backgroundColor: assignTarget?.assignedPrisonId === p.id ? `${COLORS.primary}15` : COLORS.surface,
                    borderWidth: 1.5, borderColor: assignTarget?.assignedPrisonId === p.id ? COLORS.primary : COLORS.border,
                  }}
                >
                  <Text style={{ fontWeight: '600', color: COLORS.text }}>{p.name}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{p.district}</Text>
                </TouchableOpacity>
              )}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Unassign" onPress={() => handleAssignPrison(null)} variant="outline" loading={assigning} style={{ flex: 1 }} />
              <Button title="Close" onPress={() => setAssignTarget(null)} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB — create a new officer account */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateOfficer')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Create new officer account"
        style={{
          position: 'absolute', bottom: 24, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
        }}
      >
        <Ionicons name="person-add" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};
