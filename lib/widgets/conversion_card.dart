import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import '../providers/app_state_provider.dart';
import '../services/api_service.dart';
import '../services/admob_service.dart';
import '../screens/result_screen.dart';
import '../screens/subscription_screen.dart';

class ConversionCard extends StatefulWidget {
  const ConversionCard({super.key});

  @override
  State<ConversionCard> createState() => _ConversionCardState();
}

class _ConversionCardState extends State<ConversionCard> {
  bool _isConverting = false;
  double _uploadProgress = 0.0;

  @override
  Widget build(BuildContext context) {
    return Consumer<AppStateProvider>(
      builder: (context, appState, child) {
        return Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Theme.of(context).colorScheme.primary,
                Theme.of(context).colorScheme.secondary,
              ],
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.3),
                offset: const Offset(0, 12),
                blurRadius: 32,
              ),
            ],
          ),
          child: Column(
            children: [
              // 아이콘과 제목
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Icon(
                  Icons.auto_awesome_rounded,
                  size: 48,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'AI PDF → Excel 변환',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                '인공지능으로 정확하고 완벽하게 변환합니다',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // 진행 상태 표시
              if (_isConverting) ...[
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      LinearProgressIndicator(
                        value: _uploadProgress,
                        backgroundColor: Colors.white.withValues(alpha: 0.3),
                        valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                        borderRadius: BorderRadius.circular(8),
                        minHeight: 6,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '변환 중... ${(_uploadProgress * 100).toInt()}%',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // AI 변환 버튼
              SizedBox(
                width: double.infinity,
                height: 60,
                child: FilledButton.icon(
                  onPressed: _isConverting ? null : () => _convertPdf(true),
                  icon: Icon(
                    _isConverting ? Icons.hourglass_top_rounded : Icons.auto_awesome_rounded,
                    size: 24,
                  ),
                  label: Text(
                    _isConverting ? '변환 중...' : 'AI 변환 시작하기',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Theme.of(context).colorScheme.primary,
                    disabledBackgroundColor: Colors.white.withValues(alpha: 0.7),
                    disabledForegroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.7),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),

              // 사용 제한 안내
              if (!appState.isProUser) ...[
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          appState.getConvertLimitMessage(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Future<void> _convertPdf(bool useAi) async {
    final appState = Provider.of<AppStateProvider>(context, listen: false);

    // 변환 가능 여부 확인
    if (!appState.canConvert()) {
      _showConvertLimitDialog();
      return;
    }

    try {
      setState(() {
        _isConverting = true;
        _uploadProgress = 0.0;
      });

      // 파일 선택
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        allowMultiple: false,
      );

      if (result == null || result.files.isEmpty) {
        setState(() => _isConverting = false);
        return;
      }

      final file = result.files.first;
      if (file.path == null) {
        throw Exception('파일 경로를 가져올 수 없습니다.');
      }

      // AI 변환 시 전면 광고 표시 (PRO가 아닌 경우)
      if (useAi && !appState.isProUser) {
        await adMobService.showInterstitialAd();
      }

      // PDF 업로드
      final apiService = ApiService();
      final uploadResponse = await apiService.uploadPdf(
        file.path!,
        file.name,
        useAi: useAi,
        onSendProgress: (sent, total) {
          setState(() {
            _uploadProgress = sent / total;
          });
        },
      );

      // 무료 AI 변환 횟수 차감 (PRO가 아닌 경우)
      if (!appState.isProUser) {
        await appState.useFreeAiConvert();
      }

      // 결과 화면으로 이동
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ResultScreen(
              fileId: uploadResponse.fileId,
              useAi: useAi,
            ),
          ),
        );
      }

    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('변환 실패: $error'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isConverting = false;
        _uploadProgress = 0.0;
      });
    }
  }

  void _showConvertLimitDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('AI 변환 제한'),
        content: const Text(
          '무료 AI 변환을 모두 사용했습니다.\n\n'
          '• PRO 구독으로 무제한 AI 변환\n'
          '• 건별 결제로 AI 변환 추가 구매\n'
          '• 내일 다시 무료 1회 제공',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('확인'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _navigateToSubscription();
            },
            child: const Text('PRO 구독'),
          ),
        ],
      ),
    );
  }

  void _navigateToSubscription() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const SubscriptionScreen(),
      ),
    );
  }
}