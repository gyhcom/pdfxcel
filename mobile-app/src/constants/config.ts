import { ApiConfig } from '../types';

export const API_CONFIG: ApiConfig = {
  baseUrl: __DEV__ 
    ? 'http://localhost:8000/api'  // 개발 환경
    : 'https://your-production-domain.com/api',  // 프로덕션 환경
  timeout: 30000, // 30초
};

export const COLORS = {
  primary: '#4CAF50',
  primaryDark: '#45a049',
  secondary: '#2196F3',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  error: '#f44336',
  warning: '#ff9800',
  success: '#4caf50',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};