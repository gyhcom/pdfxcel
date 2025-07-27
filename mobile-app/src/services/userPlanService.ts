import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPlan, DailyUsage, UsageLimits, UsageStatus } from '../types';

const USER_PLAN_KEY = '@user_plan';
const PRO_USER_KEY = '@is_pro_user';

// 플랜별 제한 설정
const PLAN_LIMITS = {
  FREE: {
    maxDailyUploads: 3,
    maxDailyAiUploads: 1,
    isUnlimited: false,
  },
  PRO: {
    maxDailyUploads: Infinity,
    maxDailyAiUploads: Infinity,
    isUnlimited: true,
  },
} as const;

export class UserPlanService {
  
  /**
   * 현재 날짜를 YYYY-MM-DD 형식으로 반환
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 기본 사용자 플랜 생성
   */
  private createDefaultUserPlan(isProUser: boolean = false): UserPlan {
    return {
      isProUser,
      dailyUsage: {
        date: this.getCurrentDate(),
        totalUploads: 0,
        aiUploads: 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 프로 사용자 상태 설정 (외부 인증 시스템으로 대체 가능)
   */
  async setProUser(isProUser: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(PRO_USER_KEY, JSON.stringify(isProUser));
      
      // 기존 플랜 업데이트
      const currentPlan = await this.getUserPlan();
      const updatedPlan: UserPlan = {
        ...currentPlan,
        isProUser,
        lastUpdated: new Date().toISOString(),
      };
      
      await this.saveUserPlan(updatedPlan);
    } catch (error) {
      console.error('Error setting pro user status:', error);
      throw error;
    }
  }

  /**
   * 프로 사용자 상태 확인 (외부 인증 시스템으로 대체 가능)
   */
  async isProUser(): Promise<boolean> {
    try {
      const storedValue = await AsyncStorage.getItem(PRO_USER_KEY);
      return storedValue ? JSON.parse(storedValue) : false;
    } catch (error) {
      console.error('Error checking pro user status:', error);
      return false;
    }
  }

  /**
   * 사용자 플랜 저장
   */
  private async saveUserPlan(userPlan: UserPlan): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_PLAN_KEY, JSON.stringify(userPlan));
    } catch (error) {
      console.error('Error saving user plan:', error);
      throw error;
    }
  }

  /**
   * 사용자 플랜 로드
   */
  async getUserPlan(): Promise<UserPlan> {
    try {
      const storedPlan = await AsyncStorage.getItem(USER_PLAN_KEY);
      const isProUser = await this.isProUser();
      
      if (!storedPlan) {
        // 플랜이 없으면 기본 플랜 생성
        const defaultPlan = this.createDefaultUserPlan(isProUser);
        await this.saveUserPlan(defaultPlan);
        return defaultPlan;
      }

      const userPlan: UserPlan = JSON.parse(storedPlan);
      const currentDate = this.getCurrentDate();

      // 날짜가 바뀌었으면 사용량 초기화
      if (userPlan.dailyUsage.date !== currentDate) {
        const resetPlan: UserPlan = {
          ...userPlan,
          isProUser, // 최신 프로 상태 반영
          dailyUsage: {
            date: currentDate,
            totalUploads: 0,
            aiUploads: 0,
          },
          lastUpdated: new Date().toISOString(),
        };
        
        await this.saveUserPlan(resetPlan);
        return resetPlan;
      }

      // 프로 상태 업데이트
      if (userPlan.isProUser !== isProUser) {
        const updatedPlan: UserPlan = {
          ...userPlan,
          isProUser,
          lastUpdated: new Date().toISOString(),
        };
        
        await this.saveUserPlan(updatedPlan);
        return updatedPlan;
      }

      return userPlan;
    } catch (error) {
      console.error('Error loading user plan:', error);
      // 에러 시 기본 플랜 반환
      const isProUser = await this.isProUser();
      return this.createDefaultUserPlan(isProUser);
    }
  }

  /**
   * 현재 플랜의 제한 사항 조회
   */
  async getUsageLimits(): Promise<UsageLimits> {
    const userPlan = await this.getUserPlan();
    return userPlan.isProUser ? PLAN_LIMITS.PRO : PLAN_LIMITS.FREE;
  }

  /**
   * 현재 사용 상태 조회
   */
  async getUsageStatus(): Promise<UsageStatus> {
    const userPlan = await this.getUserPlan();
    const limits = await this.getUsageLimits();

    if (limits.isUnlimited) {
      return {
        canUpload: true,
        canUseAI: true,
        remainingUploads: 'unlimited',
        remainingAiUploads: 'unlimited',
      };
    }

    const remainingUploads = Math.max(0, limits.maxDailyUploads - userPlan.dailyUsage.totalUploads);
    const remainingAiUploads = Math.max(0, limits.maxDailyAiUploads - userPlan.dailyUsage.aiUploads);

    return {
      canUpload: remainingUploads > 0,
      canUseAI: remainingAiUploads > 0,
      remainingUploads,
      remainingAiUploads,
      resetTime: this.getNextResetTime(),
    };
  }

  /**
   * 다음 초기화 시간 계산
   */
  private getNextResetTime(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  /**
   * 업로드 시 사용량 증가
   */
  async recordUpload(useAI: boolean): Promise<void> {
    try {
      const userPlan = await this.getUserPlan();
      
      const updatedUsage: DailyUsage = {
        ...userPlan.dailyUsage,
        totalUploads: userPlan.dailyUsage.totalUploads + 1,
        aiUploads: useAI 
          ? userPlan.dailyUsage.aiUploads + 1 
          : userPlan.dailyUsage.aiUploads,
      };

      const updatedPlan: UserPlan = {
        ...userPlan,
        dailyUsage: updatedUsage,
        lastUpdated: new Date().toISOString(),
      };

      await this.saveUserPlan(updatedPlan);
    } catch (error) {
      console.error('Error recording upload:', error);
      throw error;
    }
  }

  /**
   * 업로드 가능 여부 확인
   */
  async canUpload(useAI: boolean = false): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const usageStatus = await this.getUsageStatus();

      if (!usageStatus.canUpload) {
        return {
          allowed: false,
          reason: `일일 업로드 제한(${typeof usageStatus.remainingUploads === 'number' ? 
            PLAN_LIMITS.FREE.maxDailyUploads : '무제한'})에 도달했습니다.`,
        };
      }

      if (useAI && !usageStatus.canUseAI) {
        return {
          allowed: false,
          reason: `일일 AI 사용 제한(${PLAN_LIMITS.FREE.maxDailyAiUploads}회)에 도달했습니다.`,
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking upload permission:', error);
      return { allowed: false, reason: '사용량 확인 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 사용량 통계 조회 (관리용)
   */
  async getUsageStats(): Promise<{
    plan: 'FREE' | 'PRO';
    dailyUsage: DailyUsage;
    limits: UsageLimits;
    usageStatus: UsageStatus;
  }> {
    const userPlan = await this.getUserPlan();
    const limits = await this.getUsageLimits();
    const usageStatus = await this.getUsageStatus();

    return {
      plan: userPlan.isProUser ? 'PRO' : 'FREE',
      dailyUsage: userPlan.dailyUsage,
      limits,
      usageStatus,
    };
  }

  /**
   * 플랜 데이터 초기화 (개발/테스트용)
   */
  async resetUserPlan(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([USER_PLAN_KEY, PRO_USER_KEY]);
    } catch (error) {
      console.error('Error resetting user plan:', error);
      throw error;
    }
  }
}

export const userPlanService = new UserPlanService();