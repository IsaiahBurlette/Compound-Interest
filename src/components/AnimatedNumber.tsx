import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, TextStyle } from 'react-native';
import { formatCurrency } from '../lib/compound';

interface Props {
  value: number;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

export function AnimatedNumber({ value, style, duration = 700 }: Props) {
  const anim = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(v));
    Animated.timing(anim, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <Animated.Text style={style}>{formatCurrency(display)}</Animated.Text>;
}
