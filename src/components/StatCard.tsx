import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedNumber } from './AnimatedNumber';
import { colors, radii, spacing, typography } from '../theme';

interface Props {
  label: string;
  value: number;
  accentColor?: string;
  emphasis?: boolean;
}

export function StatCard({ label, value, accentColor = colors.textPrimary, emphasis }: Props) {
  return (
    <View style={[styles.card, emphasis && styles.cardEmphasis]}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedNumber
        value={value}
        style={[styles.value, { color: accentColor }, emphasis && styles.valueEmphasis]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minWidth: 140,
  },
  cardEmphasis: {
    borderColor: colors.growth,
    backgroundColor: 'rgba(52,231,166,0.08)',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.h1,
  },
  valueEmphasis: {
    fontSize: 26,
    fontWeight: '800',
  },
});
