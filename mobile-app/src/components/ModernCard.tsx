import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  useColorScheme,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ModernCardProps {
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  onPress?: () => void;
  type?: 'horizontal' | 'tile' | 'plate';
  disabled?: boolean;
}

const ModernCard: React.FC<ModernCardProps> = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
  type = 'tile',
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
    };

    switch (type) {
      case 'horizontal':
        return [styles.horizontalCard, baseStyle];
      case 'plate':
        return [styles.plateCard, baseStyle];
      default:
        return [styles.tileCard, baseStyle];
    }
  };

  const getIconContainerStyle = () => {
    switch (type) {
      case 'horizontal':
        return [styles.iconContainer, styles.horizontalIconContainer];
      case 'plate':
        return [styles.iconContainer, styles.plateIconContainer];
      default:
        return styles.iconContainer;
    }
  };

  const getTextContainerStyle = () => {
    switch (type) {
      case 'horizontal':
        return [styles.textContainer, styles.horizontalTextContainer];
      default:
        return styles.textContainer;
    }
  };

  const getTitleStyle = () => {
    switch (type) {
      case 'horizontal':
        return [styles.cardTitle, styles.horizontalTitle, { color: textColors.title }];
      case 'plate':
        return [styles.cardTitle, styles.plateTitle, { color: textColors.title }];
      default:
        return [styles.cardTitle, { color: textColors.title }];
    }
  };

  const getSubtitleStyle = () => {
    switch (type) {
      case 'horizontal':
        return [styles.cardSubtitle, styles.horizontalSubtitle, { color: textColors.subtitle }];
      case 'plate':
        return [styles.cardSubtitle, styles.plateSubtitle, { color: textColors.subtitle }];
      default:
        return [styles.cardSubtitle, { color: textColors.subtitle }];
    }
  };

  const getTextColor = () => ({
    title: isDark ? '#f9fafb' : '#111827',
    subtitle: isDark ? '#9ca3af' : '#6b7280',
  });

  const textColors = getTextColor();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[
          getCardStyle(),
          disabled && styles.disabled,
          { opacity: disabled ? 0.6 : 1 }
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <View style={[getIconContainerStyle(), { backgroundColor: color }]}>
          <Ionicons name={icon} size={type === 'plate' ? 20 : 24} color="white" />
        </View>
        
        <View style={getTextContainerStyle()}>
          <Text style={getTitleStyle()}>
            {title}
          </Text>
          <Text style={getSubtitleStyle()}>
            {subtitle}
          </Text>
        </View>

        {type === 'horizontal' && (
          <View style={styles.chevron}>
            <Ionicons name="chevron-forward" size={16} color={textColors.subtitle} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // 타일 카드 (기본)
  tileCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 3) / 2,
    aspectRatio: 1.1,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 가로 카드
  horizontalCard: {
    width: SCREEN_WIDTH - SPACING.lg * 2,
    height: 70,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // 플레이트 카드
  plateCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 4) / 3,
    height: 90,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },

  textContainer: {
    flex: 1,
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },

  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },

  chevron: {
    marginLeft: SPACING.sm,
  },

  disabled: {
    opacity: 0.6,
  },

  // 가로 카드 전용 스타일
  horizontalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.md,
    marginBottom: 0,
  },

  horizontalTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },

  horizontalTitle: {
    fontSize: 16,
    textAlign: 'left',
  },

  horizontalSubtitle: {
    fontSize: 13,
    textAlign: 'left',
  },

  // 플레이트 카드 전용 스타일
  plateIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: SPACING.xs,
  },

  plateTitle: {
    fontSize: 14,
    fontWeight: '600',
  },

  plateSubtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
});

export default ModernCard;

// 사용 예시를 위한 추가 컴포넌트들
export const HorizontalCardList: React.FC<{
  cards: Array<{
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    onPress?: () => void;
  }>;
}> = ({ cards }) => (
  <View style={{ marginVertical: SPACING.md }}>
    {cards.map((card, index) => (
      <ModernCard
        key={index}
        type="horizontal"
        {...card}
      />
    ))}
  </View>
);

export const TileGrid: React.FC<{
  cards: Array<{
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    onPress?: () => void;
  }>;
}> = ({ cards }) => (
  <View style={{
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: SPACING.md,
  }}>
    {cards.map((card, index) => (
      <ModernCard
        key={index}
        type="tile"
        {...card}
      />
    ))}
  </View>
);

export const PlateGrid: React.FC<{
  cards: Array<{
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    onPress?: () => void;
  }>;
}> = ({ cards }) => (
  <View style={{
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: SPACING.md,
  }}>
    {cards.map((card, index) => (
      <ModernCard
        key={index}
        type="plate"
        {...card}
      />
    ))}
  </View>
);