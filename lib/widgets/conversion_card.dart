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
        return Card(
          elevation: 4,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // 아이콘과 제목
                Icon(
                  Icons.picture_as_pdf_rounded,
                  size: 64,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 16),
                const Text(
                  'AI PDF → Excel 변환',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  '인공지능으로 정확하고 완벽하게 변환합니다',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

                // 진행 상태 표시
                if (_isConverting) ...[
                  LinearProgressIndicator(
                    value: _uploadProgress,
                    backgroundColor: Colors.grey[300],
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '변환 중... ${(_uploadProgress * 100).toInt()}%',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // AI 변환 버튼 (단일)
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton.icon(
                    onPressed: _isConverting ? null : () => _convertPdf(true),
                    icon: const Icon(Icons.auto_awesome, size: 24),
                    label: const Text(
                      'AI 변환 시작하기',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                          foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),

                // 사용 제한 안내
                if (!appState.isProUser) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blue[200]!),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: Colors.blue[600],
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            appState.getConvertLimitMessage(),
                            style: TextStyle(
                              color: Colors.blue[600],
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
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