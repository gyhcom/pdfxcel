/**
 * 지연 로딩 및 캐싱이 포함된 최적화된 이미지 컴포넌트
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ImageProps,
  ActivityIndicator,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { COLORS } from '../constants/config';
import memoryManager from '../utils/memoryManager';
import crashReporter from '../utils/crashReporter';

interface LazyImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  placeholder?: React.ReactNode;
  errorPlaceholder?: React.ReactNode;
  loadingIndicator?: React.ReactNode;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  cacheKey?: string;
  cacheDuration?: number; // 밀리초
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  lazy?: boolean; // 지연 로딩 여부
}

const LazyImage: React.FC<LazyImageProps> = ({
  source,
  placeholder,
  errorPlaceholder,
  loadingIndicator,
  containerStyle,
  imageStyle,
  cacheKey,
  cacheDuration = 30 * 60 * 1000, // 30분 기본값
  onLoadStart,
  onLoadEnd,
  onError,
  lazy = true,
  style,
  ...imageProps
}) => {
  const [loading, setLoading] = useState(lazy);
  const [error, setError] = useState<boolean>(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);

  // 캐시 키 생성
  const getCacheKey = useCallback(() => {
    if (cacheKey) return `image_${cacheKey}`;
    if (typeof source === 'object' && source.uri) {
      return `image_${source.uri.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    return `image_${Date.now()}`;
  }, [source, cacheKey]);

  // 이미지 로딩 시작
  const startLoading = useCallback(() => {
    if (shouldLoad) return;
    
    try {
      setShouldLoad(true);
      setLoading(true);
      setError(false);
      onLoadStart?.();
    } catch (err) {
      console.error('Error starting image load:', err);
      crashReporter.reportCrash(err as Error, {
        context: 'LazyImage.startLoading',
        source: typeof source === 'object' ? source.uri : 'static'
      });
    }
  }, [shouldLoad, onLoadStart, source]);

  // 이미지 로딩 완료 처리
  const handleLoadEnd = useCallback(() => {
    try {
      setLoading(false);
      onLoadEnd?.();
      
      // 캐시에 성공적인 로딩 기록
      if (typeof source === 'object' && source.uri) {
        const key = getCacheKey();
        memoryManager.cacheItem(key, { 
          uri: source.uri, 
          loadedAt: Date.now() 
        }, cacheDuration);
      }
    } catch (err) {
      console.error('Error handling image load end:', err);
    }
  }, [onLoadEnd, source, getCacheKey, cacheDuration]);

  // 이미지 로딩 에러 처리
  const handleError = useCallback((errorEvent: any) => {
    try {
      setLoading(false);
      setError(true);
      onError?.(errorEvent);
      
      crashReporter.reportCrash(new Error('Image loading failed'), {
        context: 'LazyImage.handleError',
        source: typeof source === 'object' ? source.uri : 'static',
        error: errorEvent?.nativeEvent?.error
      });
    } catch (err) {
      console.error('Error handling image error:', err);
    }
  }, [onError, source]);

  // 지연 로딩 시작 (뷰포트 진입 시뮬레이션)
  useEffect(() => {
    if (lazy && !shouldLoad) {
      // 컴포넌트 마운트 후 짧은 지연 후 로딩 시작
      const timer = setTimeout(() => {
        startLoading();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [lazy, shouldLoad, startLoading]);

  // 캐시된 이미지 확인
  useEffect(() => {
    if (typeof source === 'object' && source.uri) {
      const key = getCacheKey();
      const cached = memoryManager.getFromCache(key);
      
      if (cached && cached.uri === source.uri) {
        // 캐시된 이미지가 있으면 즉시 로딩
        setShouldLoad(true);
        setLoading(false);
      }
    }
  }, [source, getCacheKey]);

  // 로딩 인디케이터 렌더링
  const renderLoadingIndicator = () => {
    if (loadingIndicator) {
      return loadingIndicator;
    }
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="small" 
          color={COLORS.primary} 
        />
      </View>
    );
  };

  // 에러 플레이스홀더 렌더링
  const renderErrorPlaceholder = () => {
    if (errorPlaceholder) {
      return errorPlaceholder;
    }
    
    return (
      <View style={[styles.placeholderContainer, styles.errorContainer]}>
        {/* 기본 에러 아이콘 또는 텍스트 */}
      </View>
    );
  };

  // 플레이스홀더 렌더링
  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }
    
    return (
      <View style={[styles.placeholderContainer, styles.defaultPlaceholder]} />
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {!shouldLoad ? (
        renderPlaceholder()
      ) : error ? (
        renderErrorPlaceholder()
      ) : loading ? (
        <>
          {renderPlaceholder()}
          <View style={styles.loadingOverlay}>
            {renderLoadingIndicator()}
          </View>
        </>
      ) : (
        <Image
          {...imageProps}
          source={source}
          style={[style, imageStyle]}
          onLoadStart={() => {
            setLoading(true);
            onLoadStart?.();
          }}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          resizeMode={imageProps.resizeMode || 'cover'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.border,
  },
  defaultPlaceholder: {
    backgroundColor: COLORS.surface,
  },
  errorContainer: {
    backgroundColor: COLORS.error + '20', // 20% opacity
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default LazyImage;