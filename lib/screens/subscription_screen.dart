import 'package:flutter/material.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:provider/provider.dart';
import '../services/purchase_service.dart';
import '../providers/app_state_provider.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  List<SubscriptionPlan> _plans = [];
  bool _isLoading = true;
  bool _isPurchasing = false;

  @override
  void initState() {
    super.initState();
    _loadSubscriptionPlans();
  }

  Future<void> _loadSubscriptionPlans() async {
    try {
      // 더 긴 시간을 주고 여러 번 시도
      final products = await _retryGetProducts();
      
      if (products != null && products.isNotEmpty) {
        final subscriptionPlans = purchaseService.parseSubscriptionPlans(products);
        setState(() {
          _plans = subscriptionPlans;
          _isLoading = false;
        });
        debugPrint('✅ 실제 상품 로드 성공: ${products.length}개');
        debugPrint('✅ 구독 플랜 파싱 결과: ${subscriptionPlans.length}개');
        for (final plan in subscriptionPlans) {
          debugPrint('   - ${plan.id}: ${plan.title} (${plan.price})');
        }
      } else {
        // 실제 상품을 불러올 수 없는 경우 - 스크린샷용 Mock 데이터 사용
        debugPrint('❌ 실제 상품을 불러올 수 없음 - Mock 데이터 사용');
        setState(() {
          _plans = _getMockSubscriptionPlans();
          _isLoading = false;
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('인앱결제 상품을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 5),
            ),
          );
        }
      }
    } catch (error) {
      debugPrint('❌ 구독 상품 로드 에러: $error');
      setState(() {
        _plans = [];
        _isLoading = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('구독 상품 로드 실패: $error'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  // 재시도 로직으로 상품 로드
  Future<List<ProductDetails>?> _retryGetProducts() async {
    const maxRetries = 3;
    const retryDelay = Duration(seconds: 2);
    
    for (int i = 0; i < maxRetries; i++) {
      debugPrint('🔄 상품 로드 시도 ${i + 1}/$maxRetries');
      
      try {
        final products = await purchaseService.getProducts();
        if (products != null && products.isNotEmpty) {
          return products;
        }
        
        if (i < maxRetries - 1) {
          debugPrint('⏳ ${retryDelay.inSeconds}초 후 재시도...');
          await Future.delayed(retryDelay);
        }
      } catch (error) {
        debugPrint('❌ 시도 ${i + 1} 실패: $error');
        if (i < maxRetries - 1) {
          await Future.delayed(retryDelay);
        }
      }
    }
    
    return null;
  }

  // 스크린샷용 Mock 구독 플랜 (실제 App Store Connect 가격)
  List<SubscriptionPlan> _getMockSubscriptionPlans() {
    return [
      SubscriptionPlan(
        id: 'com.pdfxcel.mobile.Annual',
        title: 'PRO 연간 구독',
        description: '무제한 변환 + 광고 제거 + 월 \$3.33',
        price: '\$39.99',
        period: '년',
        isPopular: true,
        productDetails: null,
      ),
      SubscriptionPlan(
        id: 'com.pdfxcel.mobile.Monthly',
        title: 'PRO 월간 구독',
        description: '무제한 변환 + 광고 제거',
        price: '\$4.99',
        period: '월',
        isPopular: false,
        productDetails: null,
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PRO 구독'),
        actions: [
          TextButton(
            onPressed: _restorePurchases,
            child: const Text('구매 복원'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 헤더 섹션
                  _buildHeader(),
                  const SizedBox(height: 32),
                  
                  // 1회 변환권 옵션
                  _buildOneTimeSection(),
                  const SizedBox(height: 32),
                  
                  // 구독 플랜들
                  if (_plans.isNotEmpty) ...[
                    const Text(
                      '구독 플랜',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ..._plans.map((plan) => _buildPlanCard(plan)),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange.shade200),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            Icons.warning_rounded,
                            color: Colors.orange.shade600,
                            size: 48,
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            '구독 플랜을 불러올 수 없습니다',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'App Store Connect 설정을 확인하거나\n잠시 후 다시 시도해주세요.',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade600,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () {
                              setState(() => _isLoading = true);
                              _loadSubscriptionPlans();
                            },
                            icon: const Icon(Icons.refresh),
                            label: const Text('다시 시도'),
                          ),
                        ],
                      ),
                    ),
                  ],
                  
                  const SizedBox(height: 32),
                  
                  // 이용약관 등
                  _buildTermsSection(),
                ],
              ),
            ),
    );
  }

  Widget _buildOneTimeSection() {
    debugPrint('🎯 1회 변환권 섹션 빌드 중...');
    return Consumer<AppStateProvider>(
      builder: (context, appState, child) {
        debugPrint('🎯 현재 1회 변환권 보유: ${appState.oneTimeCredits}개');
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '빠른 구매',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF8B5CF6).withValues(alpha: 0.3),
                  width: 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF8B5CF6),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.payment_rounded,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'AI 변환 1회권',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '\$0.99 - 고품질 AI 변환을 1회 이용',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '보유: ${appState.oneTimeCredits}개',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Row(
                    children: [
                      Icon(Icons.check_circle, color: Color(0xFF8B5CF6), size: 16),
                      SizedBox(width: 8),
                      Text('광고 없는 고품질 변환', style: TextStyle(fontSize: 14)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      Icon(Icons.check_circle, color: Color(0xFF8B5CF6), size: 16),
                      SizedBox(width: 8),
                      Text('영구 보관 (만료 없음)', style: TextStyle(fontSize: 14)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: _isPurchasing ? null : () {
                        debugPrint('🎯 1회 변환권 구매 버튼 클릭됨');
                        _purchaseOneTimeCredits();
                      },
                      icon: _isPurchasing
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.shopping_cart_rounded, size: 18),
                      label: Text(
                        _isPurchasing ? '구매 중...' : '1회 변환권 구매',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B5CF6),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primary.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.diamond,
            size: 64,
            color: Colors.white,
          ),
          const SizedBox(height: 16),
          const Text(
            'PDFXcel PRO',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            '무제한 변환과 프리미엄 기능을 경험하세요',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          
          // PRO 기능들
          ...[
            '✨ 무제한 PDF 변환',
            '🚫 모든 광고 제거',
            '⚡️ 우선 처리 속도',
            '🎯 고급 AI 변환',
            '📊 상세한 변환 설정',
          ].map((feature) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                const SizedBox(width: 16),
                Text(
                  feature,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildPlanCard(SubscriptionPlan plan) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Card(
        elevation: plan.isPopular ? 8 : 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: plan.isPopular
              ? BorderSide(color: Theme.of(context).colorScheme.primary, width: 2)
              : BorderSide.none,
        ),
        child: InkWell(
          onTap: _isPurchasing ? null : () => _purchasePlan(plan),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                plan.title,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (plan.isPopular) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).colorScheme.primary,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text(
                                    '인기',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            plan.description,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      plan.price,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                if (_isPurchasing) ...[
                  const SizedBox(height: 16),
                  const LinearProgressIndicator(),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTermsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '이용약관',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '• 구독은 자동으로 갱신됩니다\n'
          '• 언제든지 App Store에서 취소할 수 있습니다\n'
          '• 구매 확인 시 Apple ID 계정에 결제됩니다\n'
          '• 무료 체험 기간 중 언제든지 취소할 수 있습니다',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
            height: 1.4,
          ),
        ),
      ],
    );
  }

  Future<void> _purchasePlan(SubscriptionPlan plan) async {
    setState(() {
      _isPurchasing = true;
    });

    try {
      // Mock 데이터인 경우 (스크린샷용)
      if (plan.productDetails == null) {
        // Mock 구매 시뮬레이션
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🎬 스크린샷 모드: 실제 구매는 TestFlight에서 가능합니다'),
              backgroundColor: Colors.blue,
              duration: Duration(seconds: 3),
            ),
          );
        }
        return;
      }
      
      debugPrint('🛒 구매 시작: ${plan.id}');
      final result = await purchaseService.purchaseProduct(plan.productDetails!);
      
      if (result['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🛒 구매 요청이 전송되었습니다. 결제 완료를 기다려주세요.'),
              backgroundColor: Colors.blue,
              duration: Duration(seconds: 3),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['error'] ?? '구매에 실패했습니다.'),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 5),
            ),
          );
        }
      }
    } catch (error) {
      debugPrint('❌ 구매 오류: $error');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('구매 오류: $error'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isPurchasing = false;
        });
      }
    }
  }

  // 1회 변환권 구매
  Future<void> _purchaseOneTimeCredits() async {
    debugPrint('🛒 1회 변환권 구매 시작...');
    setState(() => _isPurchasing = true);

    try {
      final products = await purchaseService.getProducts();
      debugPrint('🛒 로드된 상품 수: ${products?.length ?? 0}');
      
      // 상품을 불러올 수 없는 경우 Mock 구매 처리 (스크린샷용)
      if (products == null || products.isEmpty) {
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🎬 스크린샷 모드: 실제 구매는 TestFlight에서 가능합니다'),
              backgroundColor: Colors.blue,
              duration: Duration(seconds: 3),
            ),
          );
        }
        return;
      }
      
      for (final product in products) {
        debugPrint('🛒 상품: ${product.id} - ${product.title} - ${product.price}');
      }

      // OneTimeAI 상품 찾기
      final oneTimeProduct = products.firstWhere(
        (product) => product.id == 'com.pdfxcel.mobile.OneTimeAI',
        orElse: () {
          debugPrint('❌ OneTimeAI 상품을 찾을 수 없음. 사용 가능한 상품들:');
          for (final product in products) {
            debugPrint('   - ${product.id}');
          }
          return throw Exception('1회 변환권 상품을 찾을 수 없습니다.');
        },
      );
      
      debugPrint('✅ 1회 변환권 상품 찾음: ${oneTimeProduct.id} - ${oneTimeProduct.price}');

      final result = await purchaseService.purchaseProduct(oneTimeProduct);

      if (mounted) {
        if (result['success']) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white),
                  SizedBox(width: 12),
                  Text('1회 변환권 구매가 완료되었습니다!'),
                ],
              ),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );
          
          // 상태 새로고침
          final appState = Provider.of<AppStateProvider>(context, listen: false);
          await appState.refreshAll();
        } else {
          throw Exception(result['error'] ?? '구매에 실패했습니다.');
        }
      }
    } catch (error) {
      debugPrint('1회 변환권 구매 실패: $error');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(child: Text('구매 중 오류가 발생했습니다: $error')),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isPurchasing = false);
      }
    }
  }

  Future<void> _restorePurchases() async {
    try {
      debugPrint('🔄 구매 복원 시작...');
      final result = await purchaseService.restorePurchases();
      
      // 구매 복원 후 앱 상태 새로고침
      debugPrint('🔄 구매 복원 후 앱 상태 새로고침...');
      if (mounted) {
        final appState = Provider.of<AppStateProvider>(context, listen: false);
        await appState.refreshAll();
      }
      
      if (mounted) {
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(result['message'] ?? '구매 복원이 완료되었습니다.'),
                ),
              ],
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (error) {
      debugPrint('❌ 구매 복원 실패: $error');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(child: Text('복원 오류: $error')),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }
}