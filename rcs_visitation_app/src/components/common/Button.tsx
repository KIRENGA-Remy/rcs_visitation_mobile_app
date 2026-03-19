import React, { memo } from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  ViewStyle, TextStyle, AccessibilityRole
} from 'react-native';
import { COLORS, RADIUS } from '@constants';

interface ButtonProps {
  title:       string;
  onPress:     () => void;
  variant?:    'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?:       'sm' | 'md' | 'lg';
  loading?:    boolean;
  disabled?:   boolean;
  style?:      ViewStyle;
  textStyle?:  TextStyle;
  leftIcon?:   React.ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?:  AccessibilityRole;
}

const VARIANT_STYLES = {
  primary:   { bg: COLORS.primary,  text: COLORS.white,  border: undefined   },
  secondary: { bg: COLORS.accent,   text: COLORS.black,  border: undefined   },
  outline:   { bg: 'transparent',   text: COLORS.primary,border: COLORS.primary },
  ghost:     { bg: 'transparent',   text: COLORS.primary,border: undefined   },
  danger:    { bg: COLORS.error,    text: COLORS.white,  border: undefined   },
} as const;

const SIZE_STYLES = {
  sm: { height: 38, px: 16, fontSize: 13 },
  md: { height: 48, px: 24, fontSize: 15 },
  lg: { height: 56, px: 32, fontSize: 17 },
} as const;

export const Button: React.FC<ButtonProps> = memo(({
  title, onPress,
  variant = 'primary',
  size    = 'md',
  loading  = false,
  disabled = false,
  style, textStyle,
  leftIcon,
  accessibilityLabel,
  accessibilityRole = 'button',
}) => {
  const isDisabled = disabled || loading;
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[{
        backgroundColor:  v.bg,
        borderRadius:     RADIUS.md,
        height:           s.height,
        paddingHorizontal:s.px,
        alignItems:       'center',
        justifyContent:   'center',
        flexDirection:    'row',
        gap:              8,
        opacity:          isDisabled ? 0.6 : 1,
        borderWidth:      v.border ? 1.5 : 0,
        borderColor:      v.border,
        shadowColor:      variant === 'primary' ? COLORS.primary : 'transparent',
        shadowOffset:     { width: 0, height: 4 },
        shadowOpacity:    0.25,
        shadowRadius:     8,
        elevation:        variant === 'primary' ? 4 : 0,
      }, style]}
    >
      {loading
        ? <ActivityIndicator size="small" color={v.text} />
        : <>
            {leftIcon}
            <Text style={[{
              color:       v.text,
              fontSize:    s.fontSize,
              fontWeight:  '700',
              letterSpacing: 0.3,
            }, textStyle]}>
              {title}
            </Text>
          </>
      }
    </TouchableOpacity>
  );
});
