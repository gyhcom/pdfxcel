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

  // App Store Connect에서 설정한 Product ID들
  static const Set<String> _productIds = {
    'com.pdfxcel.mobile.Monthly',   // 월간 구독
    'com.pdfxcel.mobile.Annual',    // 연간 구독  
    'com.pdfxcel.mobile.Lifetime',  // 평생 이용권
    'com.pdfxcel.mobile.OneTimeAI', // AI 변환 10회
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

  // 구독 플랜 파싱
  List<SubscriptionPlan> parseSubscriptionPlans(List<ProductDetails> products) {
    final plans = <SubscriptionPlan>[];

    for (final product in products) {
      // Product ID 기반으로 플랜 식별
      final isMonthly = product.id == 'com.pdfxcel.mobile.Monthly';
      final isAnnual = product.id == 'com.pdfxcel.mobile.Annual';
      final isLifetime = product.id == 'com.pdfxcel.mobile.Lifetime';
      final isOneTime = product.id == 'com.pdfxcel.mobile.OneTimeAI';

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
      } else if (isLifetime) {
        title = 'PRO 평생 이용권';
        description = '한번 구매로 평생 무제한 이용';
        period = '평생';
        isPopular = false;
      } else if (isOneTime) {
        title = 'AI 변환 10회';
        description = '고품질 AI 변환 10회 이용권';
        period = '일회성';
        isPopular = false;
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

  // 현재 구독 상태 확인
  Future<bool> isProUser() async {
    try {
      // 로컬 상태 확인
      final prefs = await SharedPreferences.getInstance();
      final localProStatus = prefs.getBool('is_pro_user') ?? false;

      debugPrint('👤 사용자 PRO 상태: $localProStatus');
      return localProStatus;
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
      // PRO 상품인지 확인
      if (_productIds.contains(purchaseDetails.productID)) {
        await setProUser(true);
        debugPrint('✅ PRO 구독 활성화: ${purchaseDetails.productID}');
      }
    } else if (purchaseDetails.status == PurchaseStatus.error) {
      debugPrint('❌ 구매 오류: ${purchaseDetails.error}');
    }
  }

  // 로그아웃 (PRO 상태 해제)
  Future<void> logout() async {
    try {
      await setProUser(false);
      debugPrint('👋 사용자 로그아웃');
    } catch (error) {
      debugPrint('❌ 로그아웃 실패: $error');
    }
  }
}

// 싱글톤 인스턴스 export
final purchaseService = PurchaseService();