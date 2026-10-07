import React from 'react';
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

/**
 * App-wide pressable: immediate pressed feedback (opacity + subtle scale),
 * pointer cursor on web, dimmed look when disabled, comfortable hit area.
 * Drop-in replacement for React Native's Pressable.
 */
export function Press({
  style,
  disabled,
  hitSlop,
  accessibilityRole,
  ...props
}: PressableProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      hitSlop={hitSlop ?? 8}
      accessibilityRole={accessibilityRole ?? 'button'}
      style={(state) => {
        const base =
          typeof style === 'function'
            ? (style(state) as StyleProp<ViewStyle>)
            : (style as StyleProp<ViewStyle>);
        return [
          base,
          state.pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
          Platform.OS === 'web' &&
            ({ cursor: disabled ? 'not-allowed' : 'pointer' } as ViewStyle),
        ];
      }}
    />
  );
}

const styles = {
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
} as const;
