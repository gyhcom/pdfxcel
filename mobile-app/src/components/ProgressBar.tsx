import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';

interface ProgressBarProps {
  progress: number; // 0-100
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = true,
  color = COLORS.primary,
  backgroundColor = COLORS.border,
  height = 8,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {showPercentage && (
        <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
      )}
      <View style={[styles.track, { backgroundColor, height }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  percentageText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  track: {
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BORDER_RADIUS.sm,
  },
});

export default ProgressBar;