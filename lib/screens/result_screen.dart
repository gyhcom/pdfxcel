import 'dart:io';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../services/api_service.dart';
import 'preview_screen.dart';

class ResultScreen extends StatefulWidget {
  final String fileId;
  final bool useAi;

  const ResultScreen({
    super.key,
    required this.fileId,
    required this.useAi,
  });

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  bool _isDownloading = false;
  String? _downloadedFilePath;
  TablePreviewData? _previewData;
  bool _isLoadingPreview = true;
  String _conversionStatus = 'processing';
  String _statusMessage = '변환 중입니다...';

  @override
  void initState() {
    super.initState();
    _checkConversionStatusAndLoadPreview();
  }

  Future<void> _checkConversionStatusAndLoadPreview() async {
    final apiService = ApiService();
    int retryCount = 0;
    const maxRetries = 40; // 최대 40회 (약 2-3분)
    
    // 먼저 히스토리에서 파일 존재 여부 확인
    final history = await apiService.getFileHistory(widget.fileId);
    if (history == null) {
      setState(() {
        _statusMessage = '파일을 찾을 수 없습니다. 업로드를 다시 시도해주세요.';
        _conversionStatus = 'error';
        _isLoadingPreview = false;
      });
      return;
    }
    
    while (retryCount < maxRetries) {
      try {
        // 히스토리를 먼저 확인 (더 신뢰할 만함)
        final history = await apiService.getFileHistory(widget.fileId);
        String? historyStatus;
        
        if (history != null && history['file'] != null) {
          historyStatus = history['file']['status'] as String?;
          print('📋 히스토리 상태: $historyStatus');
        }
        
        // 상태 API도 확인
        final status = await apiService.getConversionStatus(widget.fileId);
        final apiStatus = status['status'] ?? 'unknown';
        
        // 히스토리 상태를 우선적으로 사용
        final finalStatus = historyStatus ?? apiStatus;
        final finalMessage = historyStatus != null 
            ? '히스토리에서 확인: $historyStatus'
            : (status['message'] ?? '상태를 확인할 수 없습니다');
        
        setState(() {
          _conversionStatus = finalStatus;
          _statusMessage = finalMessage;
        });
        
        print('🔄 최종 상태: $finalStatus (히스토리: $historyStatus, API: $apiStatus)');
        
        if (_conversionStatus == 'completed') {
          // 변환 완료 - 미리보기 로드
          await _loadPreview();
          break;
        } else if (_conversionStatus == 'failed' || _conversionStatus == 'error') {
          // 변환 실패
          setState(() {
            _isLoadingPreview = false;
          });
          
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('변환 실패: $_statusMessage'),
                backgroundColor: Colors.red,
              ),
            );
          }
          break;
        }
        
        // 상태에 따라 대기 시간 조정
        int waitTime = _conversionStatus == 'processing' ? 5 : 3; // processing일 때는 더 오래 대기
        print('⏳ ${retryCount + 1}/${maxRetries} - $_conversionStatus 상태로 ${waitTime}초 대기...');
        
        // 사용자에게 진행 상황 업데이트
        if (_conversionStatus == 'processing' && retryCount > 5) {
          setState(() {
            _statusMessage = 'AI가 복잡한 PDF를 분석 중입니다... ${retryCount * waitTime}초 경과';
          });
        }
        
        await Future.delayed(Duration(seconds: waitTime));
        retryCount++;
        
      } catch (error) {
        print('상태 확인 실패: $error');
        
        // 상태 API 실패 시 히스토리로 확인
        try {
          final history = await apiService.getFileHistory(widget.fileId);
          if (history != null && history['file'] != null) {
            final fileStatus = history['file']['status'] as String?;
            print('📋 히스토리에서 확인한 상태: $fileStatus');
            
            if (fileStatus == 'completed') {
              await _loadPreview();
              break;
            } else if (fileStatus == 'failed') {
              setState(() {
                _statusMessage = '변환 실패: 파일 처리 중 오류 발생';
                _conversionStatus = 'failed';
                _isLoadingPreview = false;
              });
              break;
            }
          }
        } catch (historyError) {
          print('📋 히스토리 확인 실패: $historyError');
        }
        
        if (retryCount > 5) {
          // 5회 이상 실패 시 직접 미리보기 시도
          print('🔄 상태 확인 실패가 계속되어 직접 미리보기 시도');
          await _loadPreview();
          break;
        }
        
        await Future.delayed(const Duration(seconds: 3));
        retryCount++;
      }
    }
    
    if (retryCount >= maxRetries) {
      // 마지막으로 한 번 더 히스토리 확인
      try {
        final finalHistory = await apiService.getFileHistory(widget.fileId);
        if (finalHistory != null && finalHistory['file'] != null) {
          final finalStatus = finalHistory['file']['status'] as String?;
          if (finalStatus == 'completed') {
            await _loadPreview();
            return;
          }
        }
      } catch (e) {
        print('최종 히스토리 확인 실패: $e');
      }
      
      setState(() {
        _statusMessage = 'AI 변환이 예상보다 오래 걸리고 있습니다';
        _conversionStatus = 'timeout';
        _isLoadingPreview = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('AI 변환이 오래 걸리고 있습니다. 잠시 후 히스토리에서 확인해보세요.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 5),
          ),
        );
      }
    }
  }

  Future<void> _loadPreview() async {
    try {
      final apiService = ApiService();
      final preview = await apiService.getTablePreview(widget.fileId);
      
      setState(() {
        _previewData = preview;
        _isLoadingPreview = false;
      });
    } catch (error) {
      setState(() {
        _isLoadingPreview = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('미리보기 로드 실패: $error'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.useAi ? 'AI 변환 결과' : '변환 결과'),
        actions: [
          if (_downloadedFilePath != null)
            IconButton(
              onPressed: _shareFile,
              icon: const Icon(Icons.share),
              tooltip: '공유',
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 상태 헤더
            _buildStatusHeader(),
            
            // 메인 컨텐츠 (스크롤 가능)
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: _isLoadingPreview
                    ? _buildLoadingState()
                    : _previewData != null
                        ? _buildSuccessContent()
                        : _buildNoPreview(),
              ),
            ),
            
            // 고정 하단 다운로드 섹션
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    offset: const Offset(0, -2),
                    blurRadius: 4,
                  ),
                ],
              ),
              child: Padding(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).padding.bottom > 0 
                    ? MediaQuery.of(context).padding.bottom 
                    : 16,
                ),
                child: _buildDownloadSection(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusHeader() {
    IconData icon;
    Color backgroundColor;
    Color borderColor;
    Color iconColor;
    String title;
    
    switch (_conversionStatus) {
      case 'completed':
        icon = Icons.check_circle;
        backgroundColor = Colors.green[50]!;
        borderColor = Colors.green[200]!;
        iconColor = Colors.green[600]!;
        title = 'AI 변환 완료!';
        break;
      case 'processing':
      case 'queued':
        icon = Icons.autorenew;
        backgroundColor = Colors.blue[50]!;
        borderColor = Colors.blue[200]!;
        iconColor = Colors.blue[600]!;
        title = 'AI 변환 중...';
        break;
      case 'failed':
      case 'error':
      case 'not_found':
        icon = Icons.error;
        backgroundColor = Colors.red[50]!;
        borderColor = Colors.red[200]!;
        iconColor = Colors.red[600]!;
        title = _conversionStatus == 'not_found' ? '변환 작업 중단됨' : '변환 실패';
        break;
      case 'running':
        icon = Icons.autorenew;
        backgroundColor = Colors.blue[50]!;
        borderColor = Colors.blue[200]!;
        iconColor = Colors.blue[600]!;
        title = 'AI 변환 진행 중...';
        break;
      case 'timeout':
        icon = Icons.access_time;
        backgroundColor = Colors.orange[50]!;
        borderColor = Colors.orange[200]!;
        iconColor = Colors.orange[600]!;
        title = 'AI 변환 시간 초과';
        break;
      default:
        icon = Icons.help;
        backgroundColor = Colors.orange[50]!;
        borderColor = Colors.orange[200]!;
        iconColor = Colors.orange[600]!;
        title = '상태 확인 중...';
    }
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor,
        border: Border(
          bottom: BorderSide(color: borderColor),
        ),
      ),
      child: Row(
        children: [
          _conversionStatus == 'processing' || _conversionStatus == 'queued'
              ? SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(
                    color: iconColor,
                    strokeWidth: 3,
                  ),
                )
              : Icon(
                  icon,
                  color: iconColor,
                  size: 32,
                ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: iconColor,
                  ),
                ),
                Text(
                  _statusMessage,
                  style: TextStyle(
                    fontSize: 14,
                    color: iconColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessContent() {
    if (_previewData == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 변환 완료 헤더
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            const Icon(Icons.check_circle, color: Colors.green),
            const SizedBox(width: 8),
            const Text(
              '변환 완료',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.green,
                height: 1.2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        
        // 데이터 요약 카드
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.blue[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.blue[200]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                offset: const Offset(0, 2),
                blurRadius: 8,
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.table_chart,
                    color: Colors.blue[600],
                    size: 28,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '변환된 데이터',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue[800],
                            height: 1.2,
                          ),
                        ),
                        Text(
                          'PDF에서 Excel로 성공적으로 변환되었습니다',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.blue[600],
                            height: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue[200]!),
                      ),
                      child: Column(
                        children: [
                          Text(
                            '${_previewData!.totalRows}',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue[700],
                            ),
                          ),
                          Text(
                            '총 행 수',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue[200]!),
                      ),
                      child: Column(
                        children: [
                          Text(
                            '${_previewData!.totalColumns}',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue[700],
                            ),
                          ),
                          Text(
                            '총 열 수',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 20),
        
        // 미리보기 버튼
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => PreviewScreen(
                    fileId: widget.fileId,
                    previewData: _previewData!,
                  ),
                ),
              );
            },
            icon: const Icon(Icons.preview),
            label: const Text(
              '데이터 미리보기',
              style: TextStyle(fontSize: 16),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue[600],
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        
        const SizedBox(height: 12),
        
        // 안내 텍스트
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.info_outline,
                color: Colors.grey[600],
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '미리보기에서 변환된 데이터를 확인한 후 Excel 파일을 다운로드하세요.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                    height: 1.2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingState() {
    return SizedBox(
      height: 400,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 24),
            Text(
              _statusMessage,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'AI가 PDF를 분석하고 있습니다...\n잠시만 기다려주세요.',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoPreview() {
    return SizedBox(
      height: 400,
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.table_chart,
              size: 64,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Text(
              '미리보기를 사용할 수 없습니다',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Excel 파일을 다운로드하여 결과를 확인하세요',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDownloadSection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_downloadedFilePath != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Icon(Icons.download_done, color: Colors.green[600]),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          '파일이 다운로드되었습니다',
                          style: TextStyle(
                            fontWeight: FontWeight.w500,
                            height: 1.2,
                          ),
                        ),
                      ),
                      TextButton(
                        onPressed: _showFileLocationHelp,
                        child: const Text('도움말'),
                      ),
                      TextButton(
                        onPressed: _openFile,
                        child: Text(Platform.isIOS ? '공유하기' : '열기'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.green[200]!),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Icon(Icons.folder, size: 16, color: Colors.grey[600]),
                            const SizedBox(width: 4),
                            Text(
                              '저장 위치:',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Colors.grey[700],
                                height: 1.2,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          Platform.isIOS
                              ? '파일 앱 > 내 iPhone > PDFXcel'
                              : '내부 저장소 > Documents',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '파일명: ${_downloadedFilePath!.split('/').last}',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],
          
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _isDownloading ? null : _downloadFile,
              icon: _isDownloading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.download),
              label: Text(
                _isDownloading ? '다운로드 중...' : 'Excel 파일 다운로드',
                style: const TextStyle(fontSize: 14),
                overflow: TextOverflow.ellipsis,
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _downloadFile() async {
    setState(() => _isDownloading = true);

    try {
      final apiService = ApiService();
      final filePath = await apiService.downloadExcel(widget.fileId);
      
      setState(() {
        _downloadedFilePath = filePath;
        _isDownloading = false;
      });
      
      if (mounted) {
        // 파일명만 추출하여 표시
        final fileName = filePath.split('/').last;
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('📥 Excel 파일이 다운로드되었습니다!\n$fileName'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 4),
            action: Platform.isIOS ? SnackBarAction(
              label: '파일 앱에서 보기',
              textColor: Colors.white,
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('파일 앱 > 내 iPhone > PDFXcel에서 확인할 수 있습니다'),
                    backgroundColor: Colors.blue,
                  ),
                );
              },
            ) : null,
          ),
        );
      }
    } catch (error) {
      setState(() => _isDownloading = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('다운로드 실패: $error'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _openFile() async {
    if (_downloadedFilePath == null) return;

    try {
      final file = File(_downloadedFilePath!);
      
      if (!await file.exists()) {
        throw '파일을 찾을 수 없습니다';
      }

      if (Platform.isIOS) {
        // iOS에서는 share sheet를 통해 Excel 앱으로 열기
        final result = await Share.shareXFiles(
          [XFile(_downloadedFilePath!)],
          text: 'Excel 파일을 열어보세요',
          subject: 'PDFXcel 변환 결과',
        );
        
        if (result.status == ShareResultStatus.success) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('파일을 공유했습니다. Excel 앱을 선택하여 열어보세요.'),
                backgroundColor: Colors.green,
              ),
            );
          }
        }
      } else {
        // Android에서는 직접 열기 시도
        final uri = Uri.file(_downloadedFilePath!);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          // 안드로이드에서도 공유로 대체
          await Share.shareXFiles([XFile(_downloadedFilePath!)]);
        }
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('파일 열기 실패: $error'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _shareFile() async {
    if (_downloadedFilePath == null) return;
    
    try {
      final file = File(_downloadedFilePath!);
      
      if (!await file.exists()) {
        throw '파일을 찾을 수 없습니다';
      }

      await Share.shareXFiles(
        [XFile(_downloadedFilePath!)],
        text: 'PDFXcel로 변환한 Excel 파일입니다',
        subject: 'PDFXcel 변환 결과',
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('파일 공유 실패: $error'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showFileLocationHelp() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.help_outline, color: Colors.blue),
              SizedBox(width: 8),
              Text("파일 위치 안내"),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (Platform.isIOS) ...[
                const Text(
                  "📱 iOS에서 파일 찾기:",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text("1. \"파일\" 앱을 열어주세요"),
                const Text("2. \"내 iPhone\" > \"PDFXcel\" 폴더로 이동"),
                const Text("3. 다운로드된 Excel 파일을 확인하세요"),
                const SizedBox(height: 12),
                const Text(
                  "💡 팁: \"공유하기\" 버튼을 눌러 다른 앱으로 바로 보낼 수도 있어요!",
                  style: TextStyle(
                    fontStyle: FontStyle.italic,
                    color: Colors.grey,
                  ),
                ),
              ] else ...[
                const Text(
                  "📱 Android에서 파일 찾기:",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 8),
                const Text("1. 파일 관리자 앱을 열어주세요"),
                const Text("2. \"내부 저장소\" > \"Documents\" 폴더로 이동"),
                const Text("3. \"PDFxcel_\" 로 시작하는 파일을 찾으세요"),
              ],
              const SizedBox(height: 16),
              if (_downloadedFilePath != null) ...[
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "다운로드된 파일:",
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _downloadedFilePath!.split("/").last,
                        style: const TextStyle(
                          fontFamily: "monospace",
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text("확인"),
            ),
            if (_downloadedFilePath != null)
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  _openFile();
                },
                child: Text(Platform.isIOS ? "공유하기" : "파일 열기"),
              ),
          ],
        );
      },
    );
  }
}