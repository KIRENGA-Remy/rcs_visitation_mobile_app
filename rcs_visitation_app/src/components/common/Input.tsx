import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '@constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label, error, leftIcon, rightIcon, onRightIconPress,
  hint, secureTextEntry, ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry ?? false);

  const borderColor = error ? COLORS.error : focused ? COLORS.primary : COLORS.border;

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, letterSpacing: 0.2 }}>
          {label}
        </Text>
      )}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.white,
        paddingHorizontal: 14,
        height: 50,
      }}>
        {leftIcon && (
          <Ionicons name={leftIcon as any} size={18} color={focused ? COLORS.primary : COLORS.textMuted} style={{ marginRight: 10 }} />
        )}
        <TextInput
          {...props}
          secureTextEntry={secure}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 0 }}
          placeholderTextColor={COLORS.textLight}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons name={rightIcon as any} size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>{error}</Text>}
      {hint && !error && <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>{hint}</Text>}
    </View>
  );
};
