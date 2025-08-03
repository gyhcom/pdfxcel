import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state_provider.dart';
import '../services/purchase_service.dart';

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
      final products = await purchaseService.getProducts();
      
      if (products != null && products.isNotEmpty) {
        setState(() {
          _plans = purchaseService.parseSubscriptionPlans(products);
          _isLoading = false;
        });
      } else {
        // 실제 상품을 불러올 수 없으면 Mock 데이터 사용 (개발/테스트용)
        debugPrint('🔄 실제 상품을 불러올 수 없어 Mock 데이터 사용');
        setState(() {
          _plans = _getMockSubscriptionPlans();
          _isLoading = false;
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('⚠️ 데모 모드: 실제 구매는 불가능합니다'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (error) {
      debugPrint('❌ 구독 상품 로드 에러: $error');
      // 에러 발생 시에도 Mock 데이터 표시
      setState(() {
        _plans = _getMockSubscriptionPlans();
        _isLoading = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('⚠️ 데모 모드: 네트워크 오류로 인해 실제 구매 불가'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    }
  }

  // Mock 구독 상품 생성 (개발/테스트용)
  List<SubscriptionPlan> _getMockSubscriptionPlans() {
    return [
      SubscriptionPlan(
        id: 'com.pdfxcel.mobile.Annual',
        title: 'PRO 연간 구독',
        description: '무제한 변환 + 광고 제거 + 60% 할인',
        price: '₩29,000',
        period: '년',
        isPopular: true,
        productDetails: null, // Mock용으로 null 설정
      ),
      SubscriptionPlan(
        id: 'com.pdfxcel.mobile.Monthly',
        title: 'PRO 월간 구독',
        description: '무제한 변환 + 광고 제거',
        price: '₩4,900',
        period: '월',
        isPopular: false,
        productDetails: null, // Mock용으로 null 설정
      ),
      SubscriptionPlan(
        id: 'com.pdfxcel.mobile.Lifetime',
        title: 'PRO 평생 이용권',
        description: '한번 구매로 평생 무제한 이용',
        price: '₩99,000',
        period: '평생',
        isPopular: false,
        productDetails: null, // Mock용으로 null 설정
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
                    const Center(
                      child: Text(
                        '현재 사용 가능한 구독 플랜이 없습니다.',
                        style: TextStyle(fontSize: 16),
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
      // Mock 데이터인 경우 (productDetails가 null)
      if (plan.productDetails == null) {
        // Mock 구매 시뮬레이션
        await Future.delayed(const Duration(seconds: 2));
        
        if (mounted) {
          // Mock PRO 활성화
          final appState = Provider.of<AppStateProvider>(context, listen: false);
          await appState.setProUser(true);
          
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('🎉 ${plan.title} 구매 완료! (데모 모드)'),
                backgroundColor: Colors.green,
              ),
            );
            
            Navigator.pop(context);
          }
        }
        return;
      }

      // 실제 구매 처리
      if (plan.productDetails == null) {
        throw Exception('상품 정보를 불러올 수 없습니다.');
      }
      final result = await purchaseService.purchaseProduct(plan.productDetails!);
      
      if (result['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🛒 구매 요청이 전송되었습니다. 잠시 후 확인해주세요.'),
              backgroundColor: Colors.blue,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['error'] ?? '구매에 실패했습니다.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('구매 오류: $error'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isPurchasing = false;
      });
    }
  }

  Future<void> _restorePurchases() async {
    try {
      final result = await purchaseService.restorePurchases();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? '구매 복원 요청이 완료되었습니다.'),
            backgroundColor: Colors.blue,
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('복원 오류: $error'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}