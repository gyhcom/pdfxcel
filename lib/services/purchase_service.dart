import 'package:flutter/foundation.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:shared_preferences/shared_preferences.dart';

// 구독 플랜 모델
class SubscriptionPlan {
  final String id;
  final String title;
  final String description;
  final String price;
  final String period;
  final bool isPopular;
  final ProductDetails? productDetails; // nullable로 변경

  SubscriptionPlan({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.period,
    required this.isPopular,
    this.productDetails, // nullable로 변경
  });
}

class PurchaseService {
  static final PurchaseService _instance = PurchaseService._internal();
  factory PurchaseService() => _instance;
  PurchaseService._internal();

  final InAppPurchase _inAppPurchase = InAppPurchase.instance;
  bool _initialized = false;

  // App Store Connect에서 설정한 Product ID들 (Bundle ID 변경에 맞춰 업데이트)
  static const Set<String> _productIds = {
    'com.pdfxcel.mobile.Monthly',   // 월간 구독
    'com.pdfxcel.mobile.Annual',    // 연간 구독  
    'com.pdfxcel.mobile.OneTimeAI', // AI 변환 1회
  };

  // 초기화
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      debugPrint('🛒 InAppPurchase 초기화 시작...');

      // In-App Purchase 사용 가능 여부 확인
      final bool available = await _inAppPurchase.isAvailable();
      if (!available) {
        debugPrint('❌ In-App Purchase를 사용할 수 없습니다');
        return;
      }

      _initialized = true;
      debugPrint('✅ InAppPurchase 초기화 완료');

      // 구매 복원 확인
      await restorePurchases();
    } catch (error) {
      debugPrint('❌ InAppPurchase 초기화 실패: $error');
    }
  }


  // 사용 가능한 구독 상품 조회
  Future<List<ProductDetails>?> getProducts() async {
    try {
      debugPrint('🛒 구독 상품 조회 중...');
      debugPrint('🔍 조회할 Product IDs: $_productIds');

      final ProductDetailsResponse response = await _inAppPurchase.queryProductDetails(_productIds);

      debugPrint('📦 응답 받음:');
      debugPrint('  - 찾은 상품: ${response.productDetails.length}개');
      debugPrint('  - 못찾은 상품: ${response.notFoundIDs.length}개');
      debugPrint('  - 에러: ${response.error}');

      if (response.notFoundIDs.isNotEmpty) {
        debugPrint('⚠️ 찾을 수 없는 상품 ID: ${response.notFoundIDs}');
        for (final id in response.notFoundIDs) {
          debugPrint('  - $id');
        }
      }

      if (response.productDetails.isNotEmpty) {
        debugPrint('✅ 구독 상품 조회 성공:');
        for (final product in response.productDetails) {
          debugPrint('  - ${product.id}: ${product.title} (${product.price})');
        }
        return response.productDetails;
      } else {
        debugPrint('⚠️ 사용 가능한 구독 상품이 없습니다');
        debugPrint('💡 가능한 원인:');
        debugPrint('  1. App Store Connect에서 상품이 승인되지 않음');
        debugPrint('  2. Bundle ID가 일치하지 않음');
        debugPrint('  3. iOS 시뮬레이터 사용 중 (실제 기기 필요)');
        debugPrint('  4. Apple Developer 계정 문제');
        return null;
      }
    } catch (error) {
      debugPrint('❌ 구독 상품 조회 실패: $error');
      return null;
    }
  }

  // 구독 플랜 파싱 (1회 변환권 제외)
  List<SubscriptionPlan> parseSubscriptionPlans(List<ProductDetails> products) {
    final plans = <SubscriptionPlan>[];

    for (final product in products) {
      // Product ID 기반으로 플랜 식별
      final isMonthly = product.id == 'com.pdfxcel.mobile.Monthly';
      final isAnnual = product.id == 'com.pdfxcel.mobile.Annual';
      final isOneTime = product.id == 'com.pdfxcel.mobile.OneTimeAI';
      
      // 1회 변환권은 구독 플랜에서 제외
      if (isOneTime) {
        debugPrint('🎯 1회 변환권 상품 발견 (구독 플랜에서 제외): ${product.id}');
        continue;
      }

      String title = '';
      String description = '';
      String period = '';
      bool isPopular = false;

      if (isMonthly) {
        title = 'PRO 월간 구독';
        description = '무제한 변환 + 광고 제거';
        period = '월';
        isPopular = false;
      } else if (isAnnual) {
        title = 'PRO 연간 구독';
        description = '무제한 변환 + 광고 제거 + 60% 할인';
        period = '년';
        isPopular = true; // 가장 인기 있는 플랜
      } else {
        // 알 수 없는 상품
        title = product.title;
        description = product.description;
        period = '기타';
        isPopular = false;
      }

      plans.add(SubscriptionPlan(
        id: product.id,
        title: title,
        description: description,
        price: product.price,
        period: period,
        isPopular: isPopular,
        productDetails: product,
      ));
    }

    // 인기 순, 가격 순으로 정렬
    plans.sort((a, b) {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return 0;
    });

    return plans;
  }

  // 구독 구매
  Future<Map<String, dynamic>> purchaseProduct(ProductDetails product) async {
    try {
      debugPrint('🛒 구독 구매 시작: ${product.id}');

      final PurchaseParam purchaseParam = PurchaseParam(productDetails: product);
      final bool success = await _inAppPurchase.buyNonConsumable(purchaseParam: purchaseParam);

      if (success) {
        debugPrint('✅ 구매 요청 성공');
        
        // 구매 완료는 purchaseStream에서 처리됨
        return {
          'success': true,
          'message': '구매 요청이 성공적으로 전송되었습니다.',
        };
      } else {
        debugPrint('❌ 구매 요청 실패');
        return {
          'success': false,
          'error': '구매 요청에 실패했습니다.',
        };
      }
    } catch (error) {
      debugPrint('❌ 구매 예외: $error');
      return {
        'success': false,
        'error': '구매 중 예상치 못한 오류가 발생했습니다: $error',
      };
    }
  }

  // 구매 복원
  Future<Map<String, dynamic>> restorePurchases() async {
    try {
      debugPrint('🔄 구매 복원 시작...');

      await _inAppPurchase.restorePurchases();
      
      // 복원된 구매는 purchaseStream에서 처리됨
      debugPrint('✅ 구매 복원 요청 완료');
      
      return {
        'success': true,
        'message': '구매 복원 요청이 완료되었습니다.',
      };
    } catch (error) {
      debugPrint('❌ 구매 복원 실패: $error');
      return {
        'success': false,
        'error': '구매 복원 중 오류가 발생했습니다: $error',
      };
    }
  }

  // 현재 구독 상태 확인 (실제 Apple 구독 상태 포함)
  Future<bool> isProUser() async {
    try {
      // 로컬 상태 확인
      final prefs = await SharedPreferences.getInstance();
      final localProStatus = prefs.getBool('is_pro_user') ?? false;

      debugPrint('👤 로컬 PRO 상태: $localProStatus');

      // 주기적으로 실제 구독 상태 확인 (마지막 확인으로부터 1시간 경과 시)
      final lastCheck = prefs.getInt('last_subscription_check') ?? 0;
      final now = DateTime.now().millisecondsSinceEpoch;
      final oneHour = 60 * 60 * 1000; // 1시간

      if (now - lastCheck > oneHour) {
        debugPrint('🔄 구독 상태 실시간 확인 중...');
        await _checkActiveSubscriptions();
        await prefs.setInt('last_subscription_check', now);
      }

      // 업데이트된 로컬 상태 반환
      final updatedStatus = prefs.getBool('is_pro_user') ?? false;
      debugPrint('👤 최종 PRO 상태: $updatedStatus');
      return updatedStatus;
    } catch (error) {
      debugPrint('❌ PRO 상태 확인 실패: $error');
      // 오류 시 로컬 상태 반환
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('is_pro_user') ?? false;
    }
  }

  // 로컬 PRO 상태 저장
  Future<void> setProUser(bool isPro) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('is_pro_user', isPro);
      debugPrint('💾 PRO 상태 저장: $isPro');
    } catch (error) {
      debugPrint('❌ PRO 상태 저장 실패: $error');
    }
  }

  // 구매 스트림 리스너 설정
  void listenToPurchaseUpdated(Function(List<PurchaseDetails>) onPurchaseUpdated) {
    _inAppPurchase.purchaseStream.listen(onPurchaseUpdated);
  }

  // 구매 완료 처리
  Future<void> completePurchase(PurchaseDetails purchaseDetails) async {
    if (purchaseDetails.pendingCompletePurchase) {
      await _inAppPurchase.completePurchase(purchaseDetails);
    }
  }

  // 구매 검증 및 PRO 상태 업데이트
  Future<void> verifyAndUpdatePurchase(PurchaseDetails purchaseDetails) async {
    if (purchaseDetails.status == PurchaseStatus.purchased) {
      // 상품 종류에 따라 다른 처리
      if (purchaseDetails.productID == 'com.pdfxcel.mobile.OneTimeAI') {
        // 1회 변환권 구매
        await addOneTimeCredits(1); // 1회 변환권 추가
        debugPrint('✅ 1회 변환권 1개 추가: ${purchaseDetails.productID}');
      } else if (_productIds.contains(purchaseDetails.productID)) {
        // PRO 구독 상품
        await setProUser(true);
        debugPrint('✅ PRO 구독 활성화: ${purchaseDetails.productID}');
      }
    } else if (purchaseDetails.status == PurchaseStatus.canceled) {
      // 구독 취소 처리
      if (_productIds.contains(purchaseDetails.productID)) {
        await setProUser(false);
        debugPrint('❌ PRO 구독 취소됨: ${purchaseDetails.productID}');
      }
    } else if (purchaseDetails.status == PurchaseStatus.error) {
      debugPrint('❌ 구매 오류: ${purchaseDetails.error}');
    } else if (purchaseDetails.status == PurchaseStatus.restored) {
      // 구매 복원 처리
      if (purchaseDetails.productID == 'com.pdfxcel.mobile.OneTimeAI') {
        // 1회 변환권은 복원하지 않음 (이미 사용된 소비성 상품)
        debugPrint('⚠️ 1회 변환권은 복원되지 않습니다: ${purchaseDetails.productID}');
      } else if (_productIds.contains(purchaseDetails.productID)) {
        await setProUser(true);
        debugPrint('🔄 PRO 구독 복원됨: ${purchaseDetails.productID}');
      }
    } else if (purchaseDetails.status == PurchaseStatus.pending) {
      debugPrint('⏳ 구매 대기 중: ${purchaseDetails.productID}');
    }
  }

  // 1회 변환권 추가
  Future<void> addOneTimeCredits(int count) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final currentCredits = prefs.getInt('onetime_credits') ?? 0;
      final newCredits = currentCredits + count;
      await prefs.setInt('onetime_credits', newCredits);
      debugPrint('💳 1회 변환권 추가: $count개 (총 $newCredits개)');
    } catch (error) {
      debugPrint('❌ 1회 변환권 추가 실패: $error');
    }
  }

  // 1회 변환권 사용 (1개 차감)
  Future<bool> useOneTimeCredit() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final currentCredits = prefs.getInt('onetime_credits') ?? 0;
      
      if (currentCredits > 0) {
        final newCredits = currentCredits - 1;
        await prefs.setInt('onetime_credits', newCredits);
        debugPrint('💳 1회 변환권 사용: 1개 차감 (남은 개수: $newCredits개)');
        return true;
      } else {
        debugPrint('⚠️ 사용 가능한 1회 변환권이 없습니다');
        return false;
      }
    } catch (error) {
      debugPrint('❌ 1회 변환권 사용 실패: $error');
      return false;
    }
  }

  // 1회 변환권 개수 확인
  Future<int> getOneTimeCredits() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final credits = prefs.getInt('onetime_credits') ?? 0;
      debugPrint('💳 현재 1회 변환권: $credits개');
      return credits;
    } catch (error) {
      debugPrint('❌ 1회 변환권 확인 실패: $error');
      return 0;
    }
  }

  // 1회 변환권 구매 가능한지 확인
  Future<bool> canPurchaseOneTimeCredits() async {
    // 인앱결제가 사용 가능한지 확인
    return await _inAppPurchase.isAvailable();
  }

  // 실제 Apple 구독 상태 확인
  Future<void> _checkActiveSubscriptions() async {
    try {
      if (!await _inAppPurchase.isAvailable()) {
        debugPrint('⚠️ 인앱결제를 사용할 수 없어 구독 상태 확인 불가');
        return;
      }

      // 구매 복원을 통해 활성 구독 확인
      await _inAppPurchase.restorePurchases();
      
      // 잠시 대기하여 복원 결과 처리
      await Future.delayed(const Duration(seconds: 2));
      
      debugPrint('✅ 실제 구독 상태 확인 완료');
    } catch (error) {
      debugPrint('❌ 실제 구독 상태 확인 실패: $error');
    }
  }

  // 수동으로 구독 상태 새로고침
  Future<void> refreshSubscriptionStatus() async {
    try {
      debugPrint('🔄 구독 상태 수동 새로고침...');
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('last_subscription_check', 0); // 강제로 다시 확인하도록
      await isProUser(); // 상태 확인 실행
    } catch (error) {
      debugPrint('❌ 구독 상태 새로고침 실패: $error');
    }
  }

  // 로그아웃 (PRO 상태 및 변환권 해제)
  Future<void> logout() async {
    try {
      await setProUser(false);
      // 변환권은 구매한 것이므로 로그아웃시에도 유지
      debugPrint('👋 사용자 로그아웃');
    } catch (error) {
      debugPrint('❌ 로그아웃 실패: $error');
    }
  }
}

// 싱글톤 인스턴스 export
final purchaseService = PurchaseService();