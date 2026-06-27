import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { AppBackground } from '../src/components/AppBackground';
import { ChartIcon, ScanIcon } from '../src/components/AppIcons';
import { colors, radius } from '../src/theme/design';

const SUMMARY_ROUTE = '/summary' as Href;

export default function HomeScreen() {
  return (
    <AppBackground>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Controle de Estoque</Text>
          <Text style={styles.subtitle}>Gerencie seu inventario de forma simples</Text>
        </View>

        <View style={styles.actions}>
          <Link asChild href="/scanner">
            <Pressable
              accessibilityLabel="Abrir scanner"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.actionButton,
                styles.scanButton,
                pressed && styles.scanButtonPressed,
              ]}
            >
              <ScanIcon />
            </Pressable>
          </Link>

          <Link asChild href={SUMMARY_ROUTE}>
            <Pressable
              accessibilityLabel="Abrir resumo"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.actionButton,
                styles.summaryButton,
                pressed && styles.summaryButtonPressed,
              ]}
            >
              <ChartIcon />
            </Pressable>
          </Link>
        </View>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 188,
    gap: 8,
  },
  actionButton: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  scanButton: {
    backgroundColor: colors.green,
  },
  scanButtonPressed: {
    backgroundColor: colors.greenPressed,
    transform: [{ scale: 0.985 }],
  },
  summaryButton: {
    backgroundColor: colors.blue,
  },
  summaryButtonPressed: {
    backgroundColor: colors.bluePressed,
    transform: [{ scale: 0.985 }],
  },
});
