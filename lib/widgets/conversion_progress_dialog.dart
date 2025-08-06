import 'package:flutter/material.dart';

class ConversionProgressDialog extends StatefulWidget {
  final String fileName;
  final VoidCallback? onCancel;
  
  const ConversionProgressDialog({
    super.key,
    required this.fileName,
    this.onCancel,
  });
  
  @override
  State<ConversionProgressDialog> createState() => _ConversionProgressDialogState();
}

class _ConversionProgressDialogState extends State<ConversionProgressDialog>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  
  int _currentStep = 0;
  final List<String> _steps = [
    '파일 업로드 중...',
    'AI가 분석 중...',
    '테이블 데이터 추출 중...',
    'Excel 파일 생성 중...',
  ];
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.3,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _animationController.repeat(reverse: true);
    _startStepAnimation();
  }
  
  void _startStepAnimation() {
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted && _currentStep < _steps.length - 1) {
        setState(() {
          _currentStep++;
        });
        _startStepAnimation();
      }
    });
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: widget.onCancel != null,
      child: Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                offset: const Offset(0, 8),
                blurRadius: 24,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // AI 로딩 애니메이션
              AnimatedBuilder(
                animation: _fadeAnimation,
                builder: (context, child) {
                  return Opacity(
                    opacity: _fadeAnimation.value,
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            const Color(0xFF3B82F6).withValues(alpha: 0.8),
                            const Color(0xFF8B5CF6).withValues(alpha: 0.8),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(
                        Icons.auto_awesome_rounded,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                  );
                },
              ),
              
              const SizedBox(height: 24),
              
              // 제목
              const Text(
                'AI 변환 진행 중',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              
              const SizedBox(height: 8),
              
              // 파일명
              Text(
                widget.fileName,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF6B7280),
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              
              const SizedBox(height: 24),
              
              // 진행 단계
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: _steps.asMap().entries.map((entry) {
                    final index = entry.key;
                    final step = entry.value;
                    final isActive = index <= _currentStep;
                    final isCurrent = index == _currentStep;
                    
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          // 단계 아이콘
                          Container(
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              color: isActive 
                                ? const Color(0xFF3B82F6)
                                : const Color(0xFFE5E7EB),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: isActive
                              ? Icon(
                                  isCurrent 
                                    ? Icons.refresh_rounded
                                    : Icons.check_rounded,
                                  color: Colors.white,
                                  size: 12,
                                )
                              : null,
                          ),
                          
                          const SizedBox(width: 12),
                          
                          // 단계 텍스트
                          Expanded(
                            child: Text(
                              step,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: isCurrent 
                                  ? FontWeight.w600 
                                  : FontWeight.normal,
                                color: isActive 
                                  ? const Color(0xFF1F2937)
                                  : const Color(0xFF9CA3AF),
                              ),
                            ),
                          ),
                          
                          // 현재 단계 로딩 표시
                          if (isCurrent)
                            const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation(
                                  Color(0xFF3B82F6),
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // 안내 메시지
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.info_outline_rounded,
                      color: Color(0xFF10B981),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        '파일 크기에 따라 1-3분 정도 소요됩니다',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              // 취소 버튼 (선택적)
              if (widget.onCancel != null) ...[
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: widget.onCancel,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF6B7280),
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  child: const Text('취소'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}