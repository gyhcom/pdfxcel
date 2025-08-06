import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state_provider.dart';
import '../services/api_service.dart';
import '../services/admob_service.dart';
import '../services/purchase_service.dart';
import '../widgets/bottom_banner_ad.dart';
import '../widgets/file_upload_dialog.dart';
import '../widgets/conversion_progress_dialog.dart';
import '../utils/network_checker.dart';
import 'subscription_screen.dart';
import 'history_screen.dart';
import 'result_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isOnline = true;

  @override
  void initState() {
    super.initState();

    _checkNetworkStatus();
  }

  Future<void> _checkNetworkStatus() async {
    final isOnline = await NetworkChecker.hasConnection();
    if (mounted) {
      setState(() {
        _isOnline = isOnline;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            // 타이틀과 슬로건
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'PDF 변환',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: const Color(0xFF1F2937),
                      fontWeight: FontWeight.bold,
                      height: 1.1,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          Consumer<AppStateProvider>(
            builder: (context, appState, child) {
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // 더보기 메뉴 버튼 (히스토리, 설정 통합)
                  Container(
                    margin: const EdgeInsets.only(right: 8),
                    child: PopupMenuButton<String>(
                      onSelected: (value) {
                        switch (value) {
                          case 'history':
                            _navigateToHistory(context);
                            break;
                          case 'settings':
                            _navigateToSettings(context);
                            break;
                        }
                      },
                      icon: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.more_vert_rounded,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'history',
                          child: Row(
                            children: [
                              Icon(Icons.history_rounded, size: 20),
                              SizedBox(width: 12),
                              Text('변환 히스토리'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'settings',
                          child: Row(
                            children: [
                              Icon(Icons.settings_rounded, size: 20),
                              SizedBox(width: 12),
                              Text('설정'),
                            ],
                          ),
                        ),
                      ],
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 8,
                      offset: const Offset(0, 8),
                    ),
                  ),
                  // PRO 구독 버튼
                  Container(
                    margin: const EdgeInsets.only(right: 16),
                    child: FilledButton.icon(
                      onPressed: () => _navigateToSubscription(context),
                      icon: Icon(
                        appState.isProUser ? Icons.diamond : Icons.workspace_premium_rounded,
                        size: 16,
                      ),
                      label: Text(
                        appState.isProUser ? 'PRO' : 'PRO 구독',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: FilledButton.styleFrom(
                        backgroundColor: appState.isProUser
                          ? const Color(0xFFEAB308)
                          : const Color(0xFF3B82F6),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: Consumer<AppStateProvider>(
        builder: (context, appState, child) {
          return Column(
            children: [
              // 오프라인 상태 배너
              if (!_isOnline) NetworkChecker.buildOfflineBanner(),

              // 메인 컨텐츠
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 20),

                      // 메인 타이틀
                      _buildMainTitle(),
                      const SizedBox(height: 24),

                      // 변환권 상태 카드
                      _buildCreditsStatusCard(appState),
                      const SizedBox(height: 24),

                      // 기능 그리드
                      _buildFunctionGrid(appState),
                      const SizedBox(height: 40),

                      // 빠른 액세스 섹션 (PRO 배너 포함)
                      _buildQuickAccessSection(),
                      const SizedBox(height: 100), // 하단 광고를 위한 여백
                    ],
                  ),
                ),
              ),

              // 하단 배너 광고 (PRO가 아닌 경우에만 표시)
              if (!appState.isProUser) const BottomBannerAd(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMainTitle() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _isOnline
            ? 'AI 기술로 PDF를 Excel로 빠르게 변환하세요'
            : '히스토리와 설정을 확인할 수 있습니다',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: _isOnline
              ? const Color(0xFF6B7280)
              : Colors.orange.shade700,
            fontSize: 16,
          ),
        ),
      ],
    );
  }

  Widget _buildFunctionGrid(AppStateProvider appState) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            offset: const Offset(0, 4),
            blurRadius: 20,
          ),
        ],
      ),
      child: Column(
        children: [
          // 메인 변환 기능
          _buildMainFunctionCard(
            icon: _isOnline ? Icons.auto_awesome_rounded : Icons.wifi_off_rounded,
            title: 'AI PDF → Excel 변환',
            subtitle: !_isOnline
              ? '인터넷 연결이 필요합니다'
              : appState.isProUser
                ? '무제한 고품질 AI 변환'
                : appState.freeAiConvertsLeft > 0
                  ? '${appState.freeAiConvertsLeft}회 무료 변환 가능'
                  : 'PRO 구독으로 무제한 변환',
            color: (!_isOnline || (appState.freeAiConvertsLeft == 0 && !appState.isProUser))
              ? const Color(0xFF6B7280)
              : const Color(0xFF3B82F6),
            onTap: _isOnline ? () => _startConversion(appState) : () {
              NetworkChecker.showOfflineDialog(context);
            },
            isLimited: !_isOnline || (appState.freeAiConvertsLeft == 0 && !appState.isProUser),
          ),
          const SizedBox(height: 20),

          // 서브 기능들
          Row(
            children: [
              Expanded(
                child: _buildSubFunctionCard(
                  icon: Icons.history_rounded,
                  title: '변환 히스토리',
                  color: const Color(0xFF8B5CF6),
                  onTap: () => _navigateToHistory(context),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildSubFunctionCard(
                  icon: Icons.help_outline_rounded,
                  title: '사용 가이드',
                  color: const Color(0xFF10B981),
                  onTap: () => _showHelpDialog(context),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMainFunctionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
    bool isLimited = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: color.withValues(alpha: 0.2),
              width: 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isLimited ? color.withValues(alpha: 0.5) : color,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isLimited ? Icons.lock_rounded : icon,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: isLimited
                                ? const Color(0xFF9CA3AF)
                                : const Color(0xFF1F2937),
                            ),
                          ),
                        ),
                        if (isLimited)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEAB308),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'PRO',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        color: isLimited
                          ? const Color(0xFF9CA3AF)
                          : const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSubFunctionCard({
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F2937),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickAccessSection() {
    return Consumer<AppStateProvider>(
      builder: (context, appState, child) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // PRO 유도 및 1회 변환권 옵션 (무료 사용자가 변환 횟수를 모두 사용한 경우에만 표시)
            if (!appState.isProUser && appState.freeAiConvertsLeft == 0 && appState.oneTimeCredits == 0) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFEAB308).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFFEAB308).withValues(alpha: 0.3),
                    width: 1,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.info_outline_rounded,
                          color: const Color(0xFFEAB308),
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            '무료 변환을 모두 사용했습니다.',
                            style: TextStyle(
                              fontSize: 14,
                              color: const Color(0xFF1F2937),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _showOneTimePurchaseDialog,
                            icon: const Icon(Icons.payment_rounded, size: 16),
                            label: const Text('1회 변환권'),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color(0xFF8B5CF6)),
                              foregroundColor: const Color(0xFF8B5CF6),
                              padding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _navigateToSubscription(context),
                            icon: const Icon(Icons.diamond, size: 16),
                            label: const Text('PRO 구독'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFEAB308),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],


            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Colors.grey.shade200,
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    offset: const Offset(0, 4),
                    blurRadius: 12,
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: appState.isProUser
                          ? const Color(0xFFEAB308).withValues(alpha: 0.1)
                          : const Color(0xFF3B82F6).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      appState.isProUser ? Icons.diamond : Icons.auto_awesome_rounded,
                      color: appState.isProUser
                          ? const Color(0xFFEAB308)
                          : const Color(0xFF3B82F6),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          appState.isProUser ? 'PRO 멤버십 활성화' : '무료 플랜',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          appState.getConvertLimitMessage(),
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (!appState.isProUser && appState.freeAiConvertsLeft == 0)
                    OutlinedButton(
                      onPressed: () => _navigateToSubscription(context),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFEAB308)),
                        foregroundColor: const Color(0xFFEAB308),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      child: const Text(
                        'PRO 구독',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
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

  Future<void> _startConversion(AppStateProvider appState) async {
    // 네트워크 연결 확인
    if (!mounted) return;
    final hasConnection = await NetworkChecker.checkConnectionWithDialog(context);
    if (!hasConnection) {
      return;
    }

    // 변환 가능 여부 확인
    if (!appState.canConvert()) {
      _showConvertLimitDialog();
      return;
    }

    try {
      // 파일 업로드 다이얼로그 표시 및 검증
      if (!mounted) return;
      final file = await FileUploadDialog.showUploadDialog(context);

      if (!mounted) return;

      if (file == null || file.path == null) {
        return; // 사용자가 취소했거나 파일이 유효하지 않음
      }

      // AI 변환 시 전면 광고 표시 (PRO가 아닌 경우)
      if (!appState.isProUser) {
        await adMobService.showInterstitialAd();
      }

      // 진행률 다이얼로그 표시
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => ConversionProgressDialog(
            fileName: file.name,
            onCancel: () {
              Navigator.of(context).pop();
              // TODO: API 호출 취소 로직 추가
            },
          ),
        );
      }

      // PDF 업로드
      final apiService = ApiService();
      final uploadResponse = await apiService.uploadPdf(
        file.path!,
        file.name,
        useAi: true,
      );

      // 진행률 다이얼로그 닫기
      if (mounted) {
        Navigator.of(context, rootNavigator: true).pop();
      }

      // 변환권 차감 (PRO > 무료 > 1회 변환권 순서)
      final conversionUsed = await appState.executeConversion();
      if (!conversionUsed) {
        // 변환권 차감 실패 (이론적으로 발생하지 않아야 함)
        throw Exception('변환권 사용에 실패했습니다.');
      }

      // 결과 화면으로 이동
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ResultScreen(
              fileId: uploadResponse.fileId,
              useAi: true,
            ),
          ),
        );
      }

    } catch (error) {
      // 진행률 다이얼로그가 열려있다면 닫기
      if (mounted) {
        Navigator.of(context, rootNavigator: true).pop();
      }

      if (mounted) {
        _showErrorDialog(context, error.toString());
      }
    }
  }

  // 1회 변환권 구매 다이얼로그
  void _showOneTimePurchaseDialog() {
    final appState = Provider.of<AppStateProvider>(context, listen: false);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.payment_rounded,
                color: Theme.of(context).primaryColor,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            const Text('1회 변환권 구매'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '고품질 AI 변환을 1회 이용할 수 있는 변환권입니다.',
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: Theme.of(context).primaryColor,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'AI 변환 1회',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: Theme.of(context).primaryColor,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        '영구 보관 (만료 없음)',
                        style: TextStyle(fontSize: 14),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: Theme.of(context).primaryColor,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        '광고 없는 고품질 변환',
                        style: TextStyle(fontSize: 14),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '현재 보유: ${appState.oneTimeCredits}개',
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _purchaseOneTimeCredits();
            },
            child: const Text('구매하기'),
          ),
        ],
      ),
    );
  }

  // 1회 변환권 구매 실행
  Future<void> _purchaseOneTimeCredits() async {
    try {
      final products = await purchaseService.getProducts();
      if (products == null || products.isEmpty) {
        _showErrorSnackBar('구매 상품을 불러올 수 없습니다.');
        return;
      }

      // OneTimeAI 상품 찾기
      final oneTimeProduct = products.firstWhere(
        (product) => product.id == 'com.pdfxcel.mobile.OneTimeAI',
        orElse: () => throw Exception('1회 변환권 상품을 찾을 수 없습니다.'),
      );

      _showLoadingSnackBar('구매 처리 중...');

      final result = await purchaseService.purchaseProduct(oneTimeProduct);

      if (!mounted) return;

      if (result['success']) {
        _showSuccessSnackBar('1회 변환권 구매가 완료되었습니다!');
        // 상태 새로고침
        final appState = Provider.of<AppStateProvider>(context, listen: false);
        await appState.refreshAll();
      } else {
        _showErrorSnackBar(result['error'] ?? '구매에 실패했습니다.');
      }
    } catch (error) {
      debugPrint('1회 변환권 구매 실패: $error');
      _showErrorSnackBar('구매 중 오류가 발생했습니다: $error');
    }
  }

  // 로딩 스낵바
  void _showLoadingSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: 12),
            Text(message),
          ],
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // 성공 스낵바
  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 12),
            Text(message),
          ],
        ),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // 에러 스낵바
  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  // 변환권 상태 카드
  Widget _buildCreditsStatusCard(AppStateProvider appState) {
    final method = appState.getConversionMethod();
    debugPrint('🎯 변환 방법: $method');
    debugPrint('🎯 PRO 상태: ${appState.isProUser}');
    debugPrint('🎯 무료 변환: ${appState.freeAiConvertsLeft}');
    debugPrint('🎯 1회 변환권: ${appState.oneTimeCredits}');
    Color cardColor;
    IconData icon;
    String title;
    String subtitle;
    Widget? actionButton;

    switch (method) {
      case ConversionMethod.pro:
        cardColor = const Color(0xFF10B981);
        icon = Icons.diamond_rounded;
        title = 'PRO 구독 활성';
        subtitle = '무제한 AI 변환 가능';
        break;
      case ConversionMethod.free:
        cardColor = const Color(0xFF3B82F6);
        icon = Icons.star_rounded;
        title = '무료 변환 ${appState.freeAiConvertsLeft}회';
        subtitle = '오늘 사용 가능한 무료 AI 변환';
        break;
      case ConversionMethod.oneTime:
        cardColor = const Color(0xFF8B5CF6);
        icon = Icons.payment_rounded;
        title = '변환권 ${appState.oneTimeCredits}개';
        subtitle = '구매한 1회 변환권으로 AI 변환 가능';
        break;
      case ConversionMethod.needPurchase:
        cardColor = const Color(0xFFEF4444);
        icon = Icons.lock_rounded;
        title = '변환권 없음';
        subtitle = '새로운 변환권을 구매하세요';
        actionButton = Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextButton(
              onPressed: () => _navigateToSubscription(context),
              style: TextButton.styleFrom(
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              ),
              child: const Text('PRO', style: TextStyle(fontSize: 12)),
            ),
            const SizedBox(width: 4),
            ElevatedButton(
              onPressed: _showOneTimePurchaseDialog,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: cardColor,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                minimumSize: Size.zero,
              ),
              child: const Text('1회권', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ],
        );
        break;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            cardColor,
            cardColor.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: cardColor.withValues(alpha: 0.3),
            offset: const Offset(0, 4),
            blurRadius: 12,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                ),
              ],
            ),
          ),
          if (actionButton != null) actionButton,
        ],
      ),
    );
  }

  void _showConvertLimitDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('AI 변환 제한'),
        content: const Text(
          '사용 가능한 AI 변환이 없습니다.\n\n'
          '• PRO 구독: 무제한 AI 변환\n'
          '• 1회 변환권: 1회 AI 변환 (개별 구매)\n'
          '• 무료: 내일 다시 1회 제공',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('나중에'),
          ),
          OutlinedButton(
            onPressed: () {
              Navigator.pop(context);
              _showOneTimePurchaseDialog();
            },
            child: const Text('1회 변환권'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _navigateToSubscription(context);
            },
            child: const Text('PRO 구독'),
          ),
        ],
      ),
    );
  }


  void _navigateToSubscription(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const SubscriptionScreen(),
      ),
    );
  }

  void _navigateToHistory(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const HistoryScreen(),
      ),
    );
  }

  void _navigateToSettings(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const SettingsScreen(),
      ),
    );
  }

  void _showErrorDialog(BuildContext context, String error) {
    String userFriendlyMessage;
    bool showRetry = true;

    // 에러 메시지를 사용자 친화적으로 변환
    if (error.contains('network') || error.contains('connection')) {
      userFriendlyMessage = '인터넷 연결을 확인해주세요.\n네트워크가 불안정하거나 연결이 끊어졌습니다.';
    } else if (error.contains('timeout')) {
      userFriendlyMessage = '요청 시간이 초과되었습니다.\n파일이 크거나 서버가 바쁠 수 있습니다.';
    } else if (error.contains('file') || error.contains('upload')) {
      userFriendlyMessage = '파일 업로드에 실패했습니다.\n다른 파일을 선택하거나 다시 시도해주세요.';
    } else if (error.contains('server') || error.contains('500')) {
      userFriendlyMessage = '서버에 일시적인 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.';
    } else {
      userFriendlyMessage = '변환 중 오류가 발생했습니다.\n다시 시도해주세요.';
      if (error.contains('permission') || error.contains('access')) {
        showRetry = false;
        userFriendlyMessage = '파일 접근 권한이 없습니다.\n설정에서 권한을 확인해주세요.';
      }
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              Icons.error_outline_rounded,
              color: Colors.red.shade600,
              size: 24,
            ),
            const SizedBox(width: 12),
            const Text('변환 실패'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(userFriendlyMessage),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.lightbulb_outline_rounded,
                    color: Color(0xFF3B82F6),
                    size: 20,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '문제가 계속되면 설정 > 문의하기를 이용해주세요',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('확인'),
          ),
          if (showRetry)
            FilledButton(
              onPressed: () {
                Navigator.pop(context);
                // 재시도 로직 - 같은 함수 다시 호출
                final appState = Provider.of<AppStateProvider>(context, listen: false);
                _startConversion(appState);
              },
              child: const Text('다시 시도'),
            ),
        ],
      ),
    );
  }

  void _showHelpDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('사용 가이드'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('1. PDF 파일 선택 또는 촬영'),
            SizedBox(height: 8),
            Text('2. AI 변환 옵션 선택 (고품질)'),
            SizedBox(height: 8),
            Text('3. 변환 완료 후 Excel 다운로드'),
            SizedBox(height: 8),
            Text('4. 히스토리에서 이전 파일 관리'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('확인'),
          ),
        ],
      ),
    );
  }

}