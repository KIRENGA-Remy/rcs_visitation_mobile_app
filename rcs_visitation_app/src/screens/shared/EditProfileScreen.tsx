import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { Avatar } from '@components/common/Avatar';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { useAuthStore } from '@stores/authStore';
import { usersApi } from '@api/users';
import { useTranslation } from '@hooks/useTranslation';
import { extractApiError } from '@utils';

/**
 * Photo upload now goes to Cloudinary (free tier) via a dedicated multipart
 * endpoint (POST /users/me/photo) instead of embedding a base64 data URI in
 * the profile JSON — that previous approach bloated the database and every
 * API response that included the user.
 *
 * expo-image-picker is NOT yet in package.json — run
 * `npx expo install expo-image-picker` before this screen will build.
 */
export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName]   = useState(user?.lastName ?? '');
  const [phone, setPhone]         = useState(user?.phone ?? '');
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(user?.profilePhoto);
  // A freshly-picked LOCAL image not yet uploaded — kept separate from
  // photoPreview (which may already be a remote Cloudinary URL) so Save
  // knows whether there's actually a new file to upload.
  const [pickedPhoto, setPickedPhoto] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [saving, setSaving]       = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);

  const handlePickPhoto = async () => {
    setPickingPhoto(true);
    try {
      // Lazy-imported so the rest of the app doesn't hard-fail if the
      // package hasn't been installed yet — only this screen needs it.
      const ImagePicker = await import('expo-image-picker');

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: 'Permission needed', text2: 'Allow photo library access to change your picture.' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType ?? 'image/jpeg';
        const name = asset.fileName ?? `profile.${mimeType.split('/')[1] ?? 'jpg'}`;
        setPickedPhoto({ uri: asset.uri, name, mimeType });
        setPhotoPreview(asset.uri); // instant local preview before upload
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Photo picker unavailable',
        text2: 'Run "npx expo install expo-image-picker" and rebuild.',
      });
    } finally {
      setPickingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      Toast.show({ type: 'error', text1: 'First and last name are required' });
      return;
    }
    setSaving(true);
    try {
      // Upload the photo first (if a new one was picked) so we have the
      // real Cloudinary URL before merging in the rest of the profile update.
      let latestUser = user;
      if (pickedPhoto) {
        latestUser = await usersApi.uploadPhoto(pickedPhoto);
      }

      const updated = await usersApi.updateMe({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        phone:     phone.trim(),
      });

      setUser({ ...latestUser, ...updated } as typeof user & {});
      Toast.show({ type: 'success', text1: 'Profile updated' });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: extractApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title={t('edit_profile')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={handlePickPhoto} disabled={pickingPhoto} activeOpacity={0.8}>
            <View>
              <Avatar firstName={firstName} lastName={lastName} size={88} photoUrl={photoPreview} />
              <View style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
                borderWidth: 3, borderColor: COLORS.surface,
              }}>
                <Ionicons name="camera" size={14} color={COLORS.white} />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>
            {pickingPhoto ? 'Opening photo library…' : 'Tap to change photo'}
          </Text>
        </View>

        <Input label="First Name" value={firstName} onChangeText={setFirstName} leftIcon="person-outline" />
        <Input label="Last Name" value={lastName} onChangeText={setLastName} leftIcon="person-outline" />
        <Input label="Phone Number" value={phone} onChangeText={setPhone} leftIcon="call-outline" keyboardType="phone-pad" />
        <Input label="Email" value={user?.email ?? ''} editable={false} leftIcon="mail-outline" hint="Email cannot be changed here — contact support." />

        <Button title="Save Changes" onPress={handleSave} loading={saving} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
};
