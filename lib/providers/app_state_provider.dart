import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/purchase_service.dart';

class AppStateProvider extends ChangeNotifier {
  // 사용자 상태
  bool _isProUser = false;
  int _freeAiConvertsLeft = 1; // AI 변환 무료 1회
  DateTime? _lastFreeConvertDate;
  
  // 앱 상태
  bool _isLoading = false;
  String? _currentFileId;
  String? _errorMessage;

  // Getters
  bool get isProUser => _isProUser;
  int get freeAiConvertsLeft => _freeAiConvertsLeft;
  bool get canConvertFree => _freeAiConvertsLeft > 0 || _isProUser;
  bool get isLoading => _isLoading;
  String? get currentFileId => _currentFileId;
  String? get errorMessage => _errorMessage;

  // 초기화
  Future<void> initialize() async {
    try {
      await _loadUserState();
      await _checkProStatus();
      await _resetDailyFreeConverts();
    } catch (error) {
      debugPrint('앱 상태 초기화 실패: $error');
    }
  }

  // 사용자 상태 로드
  Future<void> _loadUserState() async {
    final prefs = await SharedPreferences.getInstance();
    
    _isProUser = prefs.getBool('is_pro_user') ?? false;
    _freeAiConvertsLeft = prefs.getInt('free_ai_converts_left') ?? 1;
    
    final lastConvertMillis = prefs.getInt('last_free_convert_date');
    if (lastConvertMillis != null) {
      _lastFreeConvertDate = DateTime.fromMillisecondsSinceEpoch(lastConvertMillis);
    }
    
    notifyListeners();
  }

  // PRO 상태 확인
  Future<void> _checkProStatus() async {
    final isPro = await purchaseService.isProUser();
    if (_isProUser != isPro) {
      _isProUser = isPro;
      await _saveUserState();
      notifyListeners();
    }
  }

  // 일일 무료 변환 횟수 리셋
  Future<void> _resetDailyFreeConverts() async {
    if (_lastFreeConvertDate == null) {
      return; // 처음 사용하는 경우
    }

    final now = DateTime.now();
    final lastConvert = _lastFreeConvertDate!;
    
    // 마지막 변환이 다른 날이면 무료 횟수 리셋
    if (now.year != lastConvert.year || 
        now.month != lastConvert.month || 
        now.day != lastConvert.day) {
      _freeAiConvertsLeft = 1;
      await _saveUserState();
      notifyListeners();
    }
  }

  // 사용자 상태 저장
  Future<void> _saveUserState() async {
    final prefs = await SharedPreferences.getInstance();
    
    await prefs.setBool('is_pro_user', _isProUser);
    await prefs.setInt('free_ai_converts_left', _freeAiConvertsLeft);
    
    if (_lastFreeConvertDate != null) {
      await prefs.setInt('last_free_convert_date', _lastFreeConvertDate!.millisecondsSinceEpoch);
    }
  }

  // 무료 AI 변환 사용
  Future<void> useFreeAiConvert() async {
    if (_freeAiConvertsLeft > 0) {
      _freeAiConvertsLeft--;
      _lastFreeConvertDate = DateTime.now();
      await _saveUserState();
      notifyListeners();
    }
  }

  // 광고 시청으로 무료 AI 변환 추가 (제거 - AI 변환은 1회만)
  // AI 변환은 프리미엄 기능이므로 광고로 추가 제공하지 않음

  // PRO 사용자로 설정
  Future<void> setProUser(bool isPro) async {
    _isProUser = isPro;
    await _saveUserState();
    notifyListeners();
  }

  // 로딩 상태 설정
  void setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // 현재 파일 ID 설정
  void setCurrentFileId(String? fileId) {
    _currentFileId = fileId;
    notifyListeners();
  }

  // 에러 메시지 설정
  void setError(String? error) {
    _errorMessage = error;
    notifyListeners();
  }

  // 에러 메시지 지우기
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // AI 변환 가능 여부 확인
  bool canConvert() {
    return _isProUser || _freeAiConvertsLeft > 0;
  }

  // 변환 제한 메시지
  String getConvertLimitMessage() {
    if (_isProUser) {
      return '무제한 AI 변환 가능 (PRO)';
    } else if (_freeAiConvertsLeft > 0) {
      return '오늘 $_freeAiConvertsLeft회 AI 변환 가능';
    } else {
      return 'AI 변환은 PRO 구독 또는 건별 결제로 이용 가능';
    }
  }

  // 구독 상태 업데이트
  Future<void> refreshSubscriptionStatus() async {
    await _checkProStatus();
  }

  // 앱 상태 리셋 (개발용)
  Future<void> resetAppState() async {
    _isProUser = false;
    _freeAiConvertsLeft = 1;
    _lastFreeConvertDate = null;
    _currentFileId = null;
    _errorMessage = null;
    
    await _saveUserState();
    notifyListeners();
  }
}