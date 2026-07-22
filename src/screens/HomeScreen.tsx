import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Chip } from '../components/Chip';
import { SegmentedControl } from '../components/SegmentedControl';
import { LabeledSlider } from '../components/LabeledSlider';
import { GrowthChart } from '../components/GrowthChart';
import { StatCard } from '../components/StatCard';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Frequency, calculateCompoundGrowth } from '../lib/compound';
import { colors, radii, spacing, typography } from '../theme';

const FREQUENCY_LABEL: Record<Frequency, string> = {
  day: '/day',
  week: '/week',
  month: '/month',
};

interface Preset {
  id: string;
  emoji: string;
  label: string;
  amount: number;
  frequency: Frequency;
}

const PRESETS: Preset[] = [
  { id: 'coffee', emoji: '☕', label: 'Coffee', amount: 5.5, frequency: 'day' },
  { id: 'lunch', emoji: '🥪', label: 'Takeout lunch', amount: 13, frequency: 'day' },
  { id: 'smokes', emoji: '🚬', label: 'Pack a day', amount: 9, frequency: 'day' },
  { id: 'streaming', emoji: '📺', label: 'Streaming subs', amount: 45, frequency: 'month' },
];

export function HomeScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 640);

  const [activePreset, setActivePreset] = useState<string>('coffee');
  const [amountText, setAmountText] = useState('5.50');
  const [frequency, setFrequency] = useState<Frequency>('day');
  const [years, setYears] = useState(10);
  const [annualRatePct, setAnnualRatePct] = useState(7);

  const amount = Math.max(0, parseFloat(amountText.replace(/[^0-9.]/g, '')) || 0);

  const result = useMemo(
    () => calculateCompoundGrowth({ amount, frequency, years, annualRatePct }),
    [amount, frequency, years, annualRatePct],
  );

  function applyPreset(preset: Preset) {
    setActivePreset(preset.id);
    setAmountText(preset.amount.toFixed(2));
    setFrequency(preset.frequency);
  }

  function onAmountChange(text: string) {
    setActivePreset('custom');
    setAmountText(text);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, { width: contentWidth }]}>
          <Text style={styles.title}>☕ The Latte Factor</Text>
          <Text style={styles.subtitle}>
            See what your small daily spending could be worth if you invested it instead.
          </Text>

          <Text style={styles.sectionLabel}>What's the habit?</Text>
          <View style={styles.chipRow}>
            {PRESETS.map((preset) => (
              <Chip
                key={preset.id}
                label={preset.label}
                emoji={preset.emoji}
                active={activePreset === preset.id}
                onPress={() => applyPreset(preset)}
              />
            ))}
            <Chip
              label="Custom"
              emoji="✏️"
              active={activePreset === 'custom'}
              onPress={() => setActivePreset('custom')}
            />
          </View>

          <View style={styles.amountRow}>
            <View style={styles.amountInputWrap}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                value={amountText}
                onChangeText={onAmountChange}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.frequencyWrap}>
              <SegmentedControl
                value={frequency}
                onChange={(f) => {
                  setActivePreset('custom');
                  setFrequency(f);
                }}
                options={[
                  { value: 'day', label: 'Day' },
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                ]}
              />
            </View>
          </View>

          <View style={styles.card}>
            <LabeledSlider
              label="Time horizon"
              value={years}
              minimumValue={1}
              maximumValue={40}
              step={1}
              valueLabel={`${years} yr${years === 1 ? '' : 's'}`}
              onChange={(v) => setYears(Math.round(v))}
            />
            <LabeledSlider
              label="Expected annual return"
              value={annualRatePct}
              minimumValue={2}
              maximumValue={12}
              step={0.5}
              valueLabel={`${annualRatePct.toFixed(1)}%`}
              onChange={setAnnualRatePct}
            />
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroText}>
              That's{' '}
              <Text style={styles.heroHighlight}>
                ${amount.toFixed(2)}
                {FREQUENCY_LABEL[frequency]}
              </Text>
              . Invested for {years} years at {annualRatePct.toFixed(1)}%, it could grow to
            </Text>
            <AnimatedNumber value={result.finalInvested} style={styles.heroNumber} />
          </View>

          <View style={styles.card}>
            <GrowthChart points={result.points} years={years} />
          </View>

          <View style={styles.statsRow}>
            <StatCard label="You'll put in" value={result.totalContributed} />
            <StatCard
              label="Could grow to"
              value={result.finalInvested}
              accentColor={colors.growth}
            />
            <StatCard
              label="Missing out on"
              value={result.growth}
              accentColor={colors.growth}
              emphasis
            />
          </View>

          <Text style={styles.disclaimer}>
            Estimates only — not financial advice. Assumes contributions are invested monthly and
            compound at a constant annual rate; real markets fluctuate.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  content: {
    maxWidth: 640,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  amountRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minWidth: 140,
    flexGrow: 1,
  },
  dollarSign: {
    ...typography.h1,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  amountInput: {
    ...typography.h1,
    color: colors.textPrimary,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  frequencyWrap: {
    minWidth: 220,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroCard: {
    backgroundColor: 'rgba(124,92,252,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,92,252,0.35)',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  heroHighlight: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  heroNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
