export interface UploadResponse {
  file_id: string;
  message: string;
  processing_type: 'basic' | 'ai';
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ProcessingStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress?: UploadProgress;
  error?: string;
  result?: UploadResponse;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

// 사용자 플랜 관련 타입
export interface DailyUsage {
  date: string; // YYYY-MM-DD 형식
  totalUploads: number;
  aiUploads: number;
}

export interface UserPlan {
  isProUser: boolean;
  dailyUsage: DailyUsage;
  lastUpdated: string; // ISO 문자열
}

export interface UsageLimits {
  maxDailyUploads: number;
  maxDailyAiUploads: number;
  isUnlimited: boolean;
}

export interface UsageStatus {
  canUpload: boolean;
  canUseAI: boolean;
  remainingUploads: number | 'unlimited';
  remainingAiUploads: number | 'unlimited';
  resetTime?: string;
}

// 테이블 미리보기 관련 타입
export interface TablePreviewData {
  headers: string[];
  rows: (string | number)[][];
  totalRows: number;
  totalColumns: number;
}

export interface PreviewState {
  loading: boolean;
  data: TablePreviewData | null;
  error: string | null;
}