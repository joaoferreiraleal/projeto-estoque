import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackground } from '../src/components/AppBackground';
import { BackIcon, ChartIcon } from '../src/components/AppIcons';
import { colors, radius } from '../src/theme/design';
import { getStockSummary } from '../src/services/stockService';
import type { StockSummary } from '../src/services/stockService';

const EMPTY_SUMMARY: StockSummary = {
  movementCount: 0,
  productCount: 0,
  todayQuantity: 0,
  totalQuantity: 0,
};

export default function SummaryScreen() {
  const [summary, setSummary] = useState<StockSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSummary() {
      try {
        const nextSummary = await getStockSummary();

        if (mounted) {
          setSummary(nextSummary);
          setErrorMessage(null);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    { label: 'Produtos', value: summary.productCount, accent: colors.green },
    { label: 'Registros', value: summary.movementCount, accent: colors.blue },
    { label: 'Hoje', value: summary.todayQuantity, accent: colors.green },
    { label: 'Total', value: summary.totalQuantity, accent: colors.blue },
  ];

  return (
    <AppBackground contentStyle={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <Link asChild href="/">
          <Pressable
            accessibilityLabel="Voltar para inicio"
            accessibilityRole="button"
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
          >
            <BackIcon />
          </Pressable>
        </Link>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Resumo</Text>
          <Text style={styles.subtitle}>Indicadores locais</Text>
        </View>
        <View style={styles.navSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.heroIcon}>
          <ChartIcon size={18} />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.white} size="large" />
        ) : (
          <View style={styles.grid}>
            {cards.map((card) => (
              <View key={card.label} style={styles.statCard}>
                <View style={[styles.cardAccent, { backgroundColor: card.accent }]} />
                <Text numberOfLines={1} style={styles.statLabel}>
                  {card.label}
                </Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>
                  {card.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </AppBackground>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Nao foi possivel carregar o resumo.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  navButtonPressed: {
    backgroundColor: colors.surfaceStrong,
  },
  navSpacer: {
    width: 42,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 3,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  heroIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.blue,
  },
  grid: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    minWidth: 144,
    flex: 1,
    height: 104,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    padding: 14,
  },
  cardAccent: {
    width: 32,
    height: 4,
    borderRadius: 4,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  statValue: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '800',
  },
  errorText: {
    maxWidth: 320,
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
