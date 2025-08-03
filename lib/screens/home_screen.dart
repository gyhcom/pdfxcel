import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/app_state_provider.dart';
import '../widgets/pro_banner.dart';
import '../widgets/conversion_card.dart';
import '../widgets/bottom_banner_ad.dart';
import 'subscription_screen.dart';
import 'history_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Row(
          children: [
            Icon(
              Icons.picture_as_pdf_rounded,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 8),
            const Text(
              'PDFXcel',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => _navigateToHistory(context),
            icon: const Icon(Icons.history),
            tooltip: '변환 히스토리',
          ),
          Consumer<AppStateProvider>(
            builder: (context, appState, child) {
              return TextButton.icon(
                onPressed: () => _navigateToSubscription(context),
                icon: Icon(
                  appState.isProUser ? Icons.star : Icons.star_outline,
                  color: appState.isProUser ? Colors.amber : Colors.grey,
                ),
                label: Text(
                  appState.isProUser ? 'PRO' : '구독',
                  style: TextStyle(
                    color: appState.isProUser ? Colors.amber : Colors.grey[600],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Consumer<AppStateProvider>(
        builder: (context, appState, child) {
          return Column(
            children: [
              // PRO 배너 (PRO가 아닌 경우에만 표시)
              if (!appState.isProUser) const ProBanner(),
              
              // 메인 컨텐츠
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 상태 정보 카드
                      _buildStatusCard(appState),
                      const SizedBox(height: 24),
                      
                      // 변환 기능 카드
                      const ConversionCard(),
                      const SizedBox(height: 24),
                      
                      // 빠른 액세스 카드
                      _buildQuickAccessCard(),
                      const SizedBox(height: 24),
                      
                      // 기능 소개 섹션
                      _buildFeaturesSection(),
                      const SizedBox(height: 80), // 하단 광고를 위한 여백
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

  Widget _buildStatusCard(AppStateProvider appState) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              appState.isProUser ? Icons.diamond : Icons.access_time,
              color: appState.isProUser ? Colors.amber : Colors.blue,
              size: 32,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    appState.isProUser ? 'PRO 사용자' : '무료 사용자',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    appState.getConvertLimitMessage(),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            if (!appState.isProUser && appState.freeAiConvertsLeft == 0)
              ElevatedButton(
                onPressed: () => _navigateToSubscription(context),
                child: const Text('PRO 구독하기'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeaturesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '주요 기능',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        _buildFeatureItem(
          Icons.auto_awesome,
          'AI 기반 변환',
          '고품질 AI 기술로 정확한 변환',
        ),
        _buildFeatureItem(
          Icons.speed,
          '빠른 처리',
          '몇 초 안에 변환 완료',
        ),
        _buildFeatureItem(
          Icons.table_chart,
          '표 구조 유지',
          '원본 PDF의 표 구조를 정확히 보존',
        ),
        _buildFeatureItem(
          Icons.file_download,
          '간편한 다운로드',
          '변환된 Excel 파일을 바로 다운로드',
        ),
      ],
    );
  }

  Widget _buildFeatureItem(IconData icon, String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: Theme.of(context).colorScheme.primary,
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
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAccessCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '빠른 액세스',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildQuickAccessButton(
                    Icons.history,
                    '변환 히스토리',
                    '이전 변환 파일들',
                    () => _navigateToHistory(context),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildQuickAccessButton(
                    Icons.help_outline,
                    '사용 가이드',
                    '앱 사용법 보기',
                    () => _showHelpDialog(context),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAccessButton(
    IconData icon,
    String title,
    String subtitle,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 32,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
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