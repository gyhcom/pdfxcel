import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/config';

interface NetworkStatusProps {
  onNetworkChange?: (isConnected: boolean) => void;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ onNetworkChange }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkNetworkConnection = async (): Promise<boolean> => {
    try {
      setIsChecking(true);
      
      // 간단한 네트워크 테스트
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const startNetworkMonitoring = () => {
      // 초기 연결 상태 확인
      checkNetworkConnection().then(connected => {
        setIsConnected(connected);
        onNetworkChange?.(connected);
      });

      // 30초마다 네트워크 상태 확인
      intervalId = setInterval(async () => {
        const connected = await checkNetworkConnection();
        if (connected !== isConnected) {
          setIsConnected(connected);
          onNetworkChange?.(connected);
        }
      }, 30000);
    };

    startNetworkMonitoring();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConnected, onNetworkChange]);

  // 연결되어 있으면 컴포넌트를 표시하지 않음
  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons 
          name={isChecking ? "refresh" : "wifi-outline"} 
          size={20} 
          color={COLORS.error} 
          style={isChecking ? styles.spinning : undefined}
        />
        <Text style={styles.text}>
          {isChecking ? '연결 확인 중...' : '인터넷 연결을 확인해주세요'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
  spinning: {
    // React Native에서는 CSS animation이 아닌 Animated API를 사용해야 하지만
    // 간단한 효과를 위해 스타일만 정의
  },
});

export default NetworkStatus;