import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Card } from '@components/common/Card';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS } from '@constants';
import { prisonsApi } from '@api/prisons';
import { prisonersApi, PrisonerSearchResult } from '@api/prisoners';
import { visitorsApi } from '@api/visitors';
import { usersApi } from '@api/users';
import { useAuthStore } from '@stores/authStore';
import { useTranslation } from '@hooks/useTranslation';
import { extractApiError } from '@utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { VisitorStackParamList } from '@navigation/types';

type Props = { navigation: NativeStackNavigationProp<VisitorStackParamList, 'RequestVisit'> };

const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Lawyer', 'Other'];

/**
 * "Request to Visit" — the flow for a visitor who is NOT yet approved to see
 * a particular prisoner. Distinct from BookVisitScreen, which only works for
 * prisoners already on the visitor's approved list.
 *
 * Flow: pick a Prison -> search a Prisoner inside it -> declare the
 * relationship -> confirm/supply a National ID if the account doesn't have
 * one yet (optional at registration) -> submit for Officer/Admin review.
 * This does NOT create a visit request — it creates the underlying
 * ApprovedVisitorPrisoner relationship (pending), which is a prerequisite
 * for booking a visit at all (see BookVisitScreen).
 */
export const RequestVisitScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user, setUser } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPrisonId, setSelectedPrisonId] = useState('');
  const [selectedPrisoner, setSelectedPrisoner] = useState<PrisonerSearchResult | null>(null);
  const [search, setSearch] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const [nationalId, setNationalId] = useState(user?.nationalId ?? '');
  const [submitting, setSubmitting] = useState(false);

  const { data: prisonsData, isLoading: prisonsLoading } = useQuery({
    queryKey: ['prisons', 'all'],
    queryFn: () => prisonsApi.list({ limit: 100 }),
  });

  const { data: prisonersData, isLoading: prisonersLoading } = useQuery({
    queryKey: ['prisoners', 'search', selectedPrisonId, search],
    queryFn: () => prisonersApi.searchForVisitor({ prisonId: selectedPrisonId, search: search || undefined, limit: 20 }),
    enabled: !!selectedPrisonId && step === 2,
  });

  const needsNationalId = !user?.nationalId;
  const canSubmit = !!selectedPrisoner && !!relationship && (!needsNationalId || nationalId.trim().length >= 4);

  const handleSubmit = async () => {
    if (!selectedPrisoner) return;
    setSubmitting(true);
    try {
      // If the account has no National ID yet, save it first — a visitor
      // cannot be verified for a visit without one, so this is required
      // (not optional) at this specific point, even though registration
      // itself doesn't require it.
      if (needsNationalId) {
        const updated = await usersApi.updateMe({ nationalId: nationalId.trim() });
        setUser(updated);
      }

      await visitorsApi.requestContact({
        prisonerId: selectedPrisoner.id,
        relationship,
        notes: notes || undefined,
      });

      qc.invalidateQueries({ queryKey: QUERY_KEYS.MY_VISITOR });
      Toast.show({
        type: 'success',
        text1: t('request_submitted'),
        text2: t('request_submitted_desc'),
      });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: t('request_failed'), text2: extractApiError(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <ScreenHeader
        title={t('request_visit')}
        subtitle={t('request_visit_subtitle')}
        onBack={() => (step === 1 ? navigation.goBack() : setStep((s) => (s - 1) as 1 | 2 | 3))}
      />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

        {/* Step 1: Select Prison */}
        {step === 1 && (
          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 }}>
              <Text style={{ color: COLORS.primary }}>1 </Text>{t('select_prison')}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 14 }}>
              {t('select_prison_desc')}
            </Text>
            {prisonsLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
              prisonsData?.data?.map((prison) => (
                <TouchableOpacity
                  key={prison.id}
                  onPress={() => { setSelectedPrisonId(prison.id); setSelectedPrisoner(null); setSearch(''); setStep(2); }}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    borderWidth: 1.5, borderColor: COLORS.border,
                  }}
                >
                  <View>
                    <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 15 }}>{prison.name}</Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>{prison.district}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Step 2: Search + select Prisoner within that prison */}
        {step === 2 && (
          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 }}>
              <Text style={{ color: COLORS.primary }}>2 </Text>{t('select_prisoner')}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 14 }}>
              {t('select_prisoner_desc')}
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
              borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
              paddingHorizontal: 12, marginBottom: 14, height: 48,
            }}>
              <Ionicons name="search" size={18} color={COLORS.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('search_prisoner_placeholder')}
                placeholderTextColor={COLORS.textLight}
                style={{ flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text }}
              />
            </View>

            {prisonersLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : prisonersData?.data?.length === 0 ? (
              <Card variant="flat">
                <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>{t('no_prisoners_found')}</Text>
              </Card>
            ) : (
              prisonersData?.data?.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => { setSelectedPrisoner(p); setStep(3); }}
                  activeOpacity={0.85}
                  disabled={p.visitingRestricted}
                  style={{
                    backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    borderWidth: 1.5, borderColor: COLORS.border, opacity: p.visitingRestricted ? 0.5 : 1,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 15 }}>
                      {p.lastName}, {p.firstName}
                    </Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                      {t('id_label')}: {p.prisonerNumber}
                    </Text>
                    {p.visitingRestricted && (
                      <Text style={{ color: COLORS.error, fontSize: 11, marginTop: 2, fontWeight: '600' }}>
                        {t('visits_restricted')}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Step 3: Relationship + (first-time) National ID + submit */}
        {step === 3 && selectedPrisoner && (
          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 }}>
              <Text style={{ color: COLORS.primary }}>3 </Text>{t('confirm_details')}
            </Text>

            <Card variant="flat" style={{ marginBottom: 20 }}>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>
                {selectedPrisoner.lastName}, {selectedPrisoner.firstName}
              </Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                {t('id_label')}: {selectedPrisoner.prisonerNumber} · {selectedPrisoner.prison.name}
              </Text>
            </Card>

            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>
              {t('relationship_label')} *
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {RELATIONSHIPS.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRelationship(r)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                    backgroundColor: relationship === r ? COLORS.primary : COLORS.white,
                    borderWidth: 1.5, borderColor: relationship === r ? COLORS.primary : COLORS.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: relationship === r ? COLORS.white : COLORS.textMuted }}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* First-time visitors: National ID is optional at registration
                but required before a contact request can be reviewed. */}
            {needsNationalId ? (
              <>
                <View style={{
                  flexDirection: 'row', gap: 10, backgroundColor: '#FFFBEB', borderRadius: 12,
                  padding: 12, borderWidth: 1, borderColor: COLORS.warning, marginBottom: 12,
                }}>
                  <Ionicons name="information-circle-outline" size={20} color={COLORS.warning} />
                  <Text style={{ flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 }}>
                    {t('first_time_id_notice')}
                  </Text>
                </View>
                <Input
                  label={t('national_id_label')}
                  placeholder={t('national_id_placeholder')}
                  value={nationalId}
                  onChangeText={setNationalId}
                  leftIcon="card-outline"
                  keyboardType="number-pad"
                />
              </>
            ) : (
              <Input label={t('national_id_label')} value={user?.nationalId ?? ''} editable={false} leftIcon="card-outline" />
            )}

            <Input
              label={t('notes_optional')}
              placeholder={t('notes_placeholder')}
              value={notes}
              onChangeText={setNotes}
              multiline
              style={{ height: 80 }}
            />

            <Button
              title={t('submit_contact_request')}
              onPress={handleSubmit}
              loading={submitting}
              disabled={!canSubmit}
              style={{ marginTop: 8 }}
              leftIcon={<Ionicons name="paper-plane-outline" size={18} color={COLORS.white} />}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};
