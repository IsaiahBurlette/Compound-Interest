import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing, typography } from '../theme';

interface Props {
  label: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  valueLabel: string;
  onChange: (value: number) => void;
}

export function LabeledSlider({
  label,
  value,
  minimumValue,
  maximumValue,
  step = 1,
  valueLabel,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{valueLabel}</Text>
      </View>
      <Slider
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.chipBorder}
        thumbTintColor={colors.accentSoft}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
