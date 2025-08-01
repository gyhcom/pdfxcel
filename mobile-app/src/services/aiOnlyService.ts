import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserAIState {
  isProUser: boolean;
  aiFreeUsedToday: boolean;
  adWatchedToday: boolean;
  lastFreeUsageDate: string;
  dailyResetTime: string; // "00:00" 형태
}

class AIOnlyService {
  private readonly STORAGE_KEY = 'user_ai_state';
  private readonly DEFAULT_STATE: UserAIState = {
    isProUser: false,
    aiFreeUsedToday: false,
    adWatchedToday: false,
    lastFreeUsageDate: '',
    dailyResetTime: '00:00',
  };

  // 사용자 AI 상태 가져오기
  async getUserAIState(): Promise<UserAIState> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return this.DEFAULT_STATE;
      
      const state: UserAIState = JSON.parse(stored);
      
      // 날짜가 바뀌었으면 일일 사용량 리셋
      const today = new Date().toDateString();
      const lastUsageDate = new Date(state.lastFreeUsageDate).toDateString();
      
      if (today !== lastUsageDate) {
        state.aiFreeUsedToday = false;
        state.adWatchedToday = false;
      }
      
      return state;
    } catch (error) {
      console.error('Error loading AI state:', error);
      return this.DEFAULT_STATE;
    }
  }

  // 사용자 AI 상태 저장
  async saveUserAIState(state: UserAIState): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving AI state:', error);
    }
  }

  // AI 변환 가능 여부 확인
  async canUseAI(): Promise<{
    allowed: boolean;
    reason: 'pro_unlimited' | 'free_available' | 'need_ad' | 'need_subscription' | 'tomorrow';
    nextAvailableTime?: string;
  }> {
    const state = await this.getUserAIState();
    
    // PRO 사용자는 무제한
    if (state.isProUser) {
      return { allowed: true, reason: 'pro_unlimited' };
    }
    
    // FREE 사용자 로직
    if (!state.aiFreeUsedToday) {
      if (!state.adWatchedToday) {
        return { allowed: false, reason: 'need_ad' };
      }
      return { allowed: true, reason: 'free_available' };
    }
    
    // 오늘 무료 사용량 소진
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return {
      allowed: false,
      reason: 'need_subscription',
      nextAvailableTime: tomorrow.toISOString(),
    };
  }

  // 광고 시청 완료 처리
  async markAdWatched(): Promise<void> {
    const state = await this.getUserAIState();
    state.adWatchedToday = true;
    state.lastFreeUsageDate = new Date().toISOString();
    await this.saveUserAIState(state);
  }

  // AI 변환 사용 처리
  async markAIUsed(): Promise<void> {
    const state = await this.getUserAIState();
    state.aiFreeUsedToday = true;
    state.lastFreeUsageDate = new Date().toISOString();
    await this.saveUserAIState(state);
  }

  // PRO 구독 상태 변경
  async setProUser(isPro: boolean): Promise<void> {
    const state = await this.getUserAIState();
    state.isProUser = isPro;
    await this.saveUserAIState(state);
  }

  // 내일까지 남은 시간 계산
  getTimeUntilTomorrow(): { hours: number; minutes: number } {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  }

  // 개발용: 상태 리셋
  async resetForTesting(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }
}

export const aiOnlyService = new AIOnlyService();
export type { UserAIState };