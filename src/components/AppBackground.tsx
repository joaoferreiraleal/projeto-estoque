import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { gradients } from '../theme/design';

interface AppBackgroundProps extends PropsWithChildren {
  contentStyle?: StyleProp<ViewStyle>;
  safe?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppBackground({
  children,
  contentStyle,
  safe = true,
  style,
}: AppBackgroundProps) {
  const Container = safe ? SafeAreaView : View;

  return (
    <LinearGradient
      colors={gradients.app}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={[styles.background, style]}
    >
      <Container style={[styles.content, contentStyle]}>{children}</Container>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
