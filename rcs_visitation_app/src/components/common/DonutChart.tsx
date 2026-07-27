import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '@constants';

interface Slice { label: string; value: number; color: string }

/**
 * A real proportional donut chart built from stacked SVG circles using the
 * stroke-dasharray/stroke-dashoffset technique — each slice is one <Circle>
 * whose visible arc length is proportional to its share of the total.
 * No charting library needed since react-native-svg was already a
 * dependency; this keeps the bundle lean and matches the hand-built bar
 * chart already in ReportsScreen.
 */
export const DonutChart: React.FC<{ data: Slice[]; size?: number; strokeWidth?: number }> = ({
  data, size = 140, strokeWidth = 22,
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total === 0 ? (
            <Circle
              cx={size / 2} cy={size / 2} r={radius}
              stroke={COLORS.border} strokeWidth={strokeWidth} fill="none"
            />
          ) : data.filter(d => d.value > 0).map((slice, i) => {
            const fraction = slice.value / total;
            const dash = fraction * circumference;
            const el = (
              <Circle
                key={i}
                cx={size / 2} cy={size / 2} r={radius}
                stroke={slice.color} strokeWidth={strokeWidth} fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-cumulativeOffset}
                strokeLinecap="butt"
                // Rotate so slices start at 12 o'clock instead of 3 o'clock
                origin={`${size / 2}, ${size / 2}`}
                rotation={-90}
              />
            );
            cumulativeOffset += dash;
            return el;
          })}
        </Svg>
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>{total}</Text>
          <Text style={{ fontSize: 10, color: COLORS.textMuted }}>total</Text>
        </View>
      </View>

      <View style={{ flex: 1, gap: 8 }}>
        {data.map((slice) => (
          <View key={slice.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: slice.color }} />
            <Text style={{ flex: 1, fontSize: 12, color: COLORS.textMuted }} numberOfLines={1}>{slice.label}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text }}>{slice.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
