import { userPlanService } from '../services/userPlanService';

/**
 * 구독 관리자 - 향후 RevenueCat이나 외부 인증 시스템으로 대체 가능
 */
export class SubscriptionManager {
  
  /**
   * 외부 인증 시스템에서 프로 상태 확인 (예: RevenueCat, 서버 API 등)
   * 현재는 로컬 상태를 반환하지만, 향후 외부 시스템과 연동 가능
   */
  static async checkProStatusFromExternalSource(): Promise<boolean> {
    try {
      // TODO: 외부 인증 시스템 연동
      // 예시:
      // const response = await fetch('/api/user/subscription');
      // const data = await response.json();
      // return data.isProUser;
      
      // 현재는 로컬 상태 반환
      return await userPlanService.isProUser();
    } catch (error) {
      console.error('Error checking external pro status:', error);
      return false;
    }
  }

  /**
   * 외부 시스템과 로컬 상태 동기화
   */
  static async syncSubscriptionStatus(): Promise<void> {
    try {
      const externalProStatus = await this.checkProStatusFromExternalSource();
      const localProStatus = await userPlanService.isProUser();
      
      // 외부 상태와 로컬 상태가 다르면 동기화
      if (externalProStatus !== localProStatus) {
        await userPlanService.setProUser(externalProStatus);
      }
    } catch (error) {
      console.error('Error syncing subscription status:', error);
    }
  }

  /**
   * 구독 업그레이드 처리 (향후 RevenueCat 연동)
   */
  static async upgradeToProPlan(): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: 실제 결제 처리 (RevenueCat 등)
      // 예시:
      // const purchaseResult = await Purchases.purchaseProduct('pro_plan');
      // if (purchaseResult.customerInfo.entitlements.active.pro) {
      //   await userPlanService.setProUser(true);
      //   return { success: true };
      // }
      
      // 개발용: 즉시 PRO로 업그레이드
      await userPlanService.setProUser(true);
      return { success: true };
    } catch (error) {
      console.error('Error upgrading to pro plan:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '업그레이드 실패' 
      };
    }
  }

  /**
   * 구독 취소 처리
   */
  static async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: 실제 구독 취소 처리
      // 예시:
      // await fetch('/api/user/cancel-subscription', { method: 'POST' });
      
      // 개발용: 즉시 FREE로 다운그레이드
      await userPlanService.setProUser(false);
      return { success: true };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '구독 취소 실패' 
      };
    }
  }

  /**
   * 구독 상태 확인 (외부 시스템 포함)
   */
  static async getSubscriptionInfo(): Promise<{
    isProUser: boolean;
    source: 'local' | 'external';
    lastSync?: string;
  }> {
    try {
      const localStatus = await userPlanService.isProUser();
      const externalStatus = await this.checkProStatusFromExternalSource();
      
      return {
        isProUser: externalStatus,
        source: localStatus === externalStatus ? 'local' : 'external',
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting subscription info:', error);
      return {
        isProUser: false,
        source: 'local',
      };
    }
  }
}

export const subscriptionManager = SubscriptionManager;