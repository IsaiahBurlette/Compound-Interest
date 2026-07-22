import React, { useEffect, useMemo } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop, Line, ClipPath, G } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MonthPoint } from '../lib/compound';
import { colors, radii, spacing, typography } from '../theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface Props {
  points: MonthPoint[];
  years: number;
}

const HEIGHT = 220;
const MAX_SAMPLES = 96;

function downsample(points: MonthPoint[], maxSamples: number): MonthPoint[] {
  if (points.length <= maxSamples) return points;
  const step = (points.length - 1) / (maxSamples - 1);
  const out: MonthPoint[] = [];
  for (let i = 0; i < maxSamples; i++) {
    out.push(points[Math.round(i * step)]);
  }
  return out;
}

export function GrowthChart({ points, years }: Props) {
  const [width, setWidth] = React.useState(0);
  const progress = useSharedValue(0);

  const sampled = useMemo(() => downsample(points, MAX_SAMPLES), [points]);
  const maxInvested = useMemo(
    () => Math.max(1, ...sampled.map((p) => p.invested)) * 1.1,
    [sampled],
  );

  const { investedLine, investedArea, contributedLine } = useMemo(() => {
    if (width === 0) return { investedLine: '', investedArea: '', contributedLine: '' };
    const n = sampled.length;
    const coord = (i: number, value: number) => ({
      x: (i / (n - 1)) * width,
      y: HEIGHT - (value / maxInvested) * HEIGHT,
    });

    const investedPts = sampled.map((p, i) => coord(i, p.invested));
    const contributedPts = sampled.map((p, i) => coord(i, p.contributed));

    const line = (pts: { x: number; y: number }[]) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

    const area =
      line(investedPts) +
      ` L ${investedPts[investedPts.length - 1].x.toFixed(2)} ${HEIGHT} L ${investedPts[0].x.toFixed(2)} ${HEIGHT} Z`;

    return {
      investedLine: line(investedPts),
      investedArea: area,
      contributedLine: line(contributedPts),
    };
  }, [sampled, width, maxInvested]);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [investedLine, progress]);

  const animatedProps = useAnimatedProps(() => ({
    width: Math.max(0, Math.min(width, progress.value * width)),
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View>
      <View onLayout={onLayout} style={styles.chartBox}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.growth} stopOpacity={0.45} />
                <Stop offset="1" stopColor={colors.growth} stopOpacity={0.02} />
              </LinearGradient>
              <ClipPath id="reveal">
                <AnimatedRect x={0} y={0} height={HEIGHT} animatedProps={animatedProps} />
              </ClipPath>
            </Defs>

            {[0.25, 0.5, 0.75].map((f) => (
              <Line
                key={f}
                x1={0}
                x2={width}
                y1={HEIGHT * f}
                y2={HEIGHT * f}
                stroke={colors.surfaceBorder}
                strokeWidth={1}
                strokeDasharray="2 6"
              />
            ))}

            <G clipPath="url(#reveal)">
              <Path d={investedArea} fill="url(#areaGrad)" />
              <Path
                d={contributedLine}
                stroke={colors.spend}
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
                opacity={0.85}
              />
              <Path d={investedLine} stroke={colors.growth} strokeWidth={3} fill="none" />
            </G>
          </Svg>
        ) : null}
      </View>

      <View style={styles.xAxis}>
        <Text style={styles.axisLabel}>Today</Text>
        <Text style={styles.axisLabel}>Year {years}</Text>
      </View>

      <View style={styles.legend}>
        <LegendItem color={colors.growth} label="Invested & growing" />
        <LegendItem color={colors.spend} label="Just spent, no growth" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chartBox: {
    height: HEIGHT,
    width: '100%',
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  axisLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
