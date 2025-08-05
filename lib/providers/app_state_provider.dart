import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/purchase_service.dart';

class AppStateProvider extends ChangeNotifier {
  // 사용자 상태
  bool _isProUser = false;
  int _freeAiConvertsLeft = 1; // AI 변환 무료 1회
  int _oneTimeCredits = 0; // 1회 변환권 개수
  DateTime? _lastFreeConvertDate;
  
  // 앱 상태
  bool _isLoading = false;
  String? _currentFileId;
  String? _errorMessage;

  // Getters
  bool get isProUser => _isProUser;
  int get freeAiConvertsLeft => _freeAiConvertsLeft;
  int get oneTimeCredits => _oneTimeCredits;
  bool get canConvertFree => _freeAiConvertsLeft > 0 || _isProUser;
  bool get hasOneTimeCredits => _oneTimeCredits > 0;
  bool get canConvertWithCredits => hasOneTimeCredits || canConvertFree;
  bool get isLoading => _isLoading;
  String? get currentFileId => _currentFileId;
  String? get errorMessage => _errorMessage;

  // 초기화
  Future<void> initialize() async {
    try {
      await _loadUserState();
      await _checkProStatus();
      await _loadOneTimeCredits();
      await _resetDailyFreeConverts();
      
      // 구매 스트림 리스너 설정 (샌드박스 테스트를 위해 필수)
      _setupPurchaseListener();
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

  // 1회 변환권 로드
  Future<void> _loadOneTimeCredits() async {
    _oneTimeCredits = await purchaseService.getOneTimeCredits();
    notifyListeners();
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

  // 1회 변환권 사용
  Future<bool> useOneTimeCredit() async {
    final success = await purchaseService.useOneTimeCredit();
    if (success) {
      _oneTimeCredits--;
      notifyListeners();
      return true;
    }
    return false;
  }

  // 1회 변환권 추가 (구매 후 호출)
  Future<void> addOneTimeCredits(int count) async {
    await purchaseService.addOneTimeCredits(count);
    await _loadOneTimeCredits(); // 최신 상태로 갱신
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

  // AI 변환 가능 여부 확인 (전체)
  bool canConvert() {
    return _isProUser || _freeAiConvertsLeft > 0 || _oneTimeCredits > 0;
  }

  // 변환 방법 우선순위: PRO > 무료 > 1회 변환권
  ConversionMethod getConversionMethod() {
    if (_isProUser) {
      return ConversionMethod.pro;
    } else if (_freeAiConvertsLeft > 0) {
      return ConversionMethod.free;
    } else if (_oneTimeCredits > 0) {
      return ConversionMethod.oneTime;
    } else {
      return ConversionMethod.needPurchase;
    }
  }

  // 변환 실행 (우선순위에 따라 차감)
  Future<bool> executeConversion() async {
    final method = getConversionMethod();
    
    switch (method) {
      case ConversionMethod.pro:
        // PRO 사용자는 차감 없음
        return true;
      case ConversionMethod.free:
        await useFreeAiConvert();
        return true;
      case ConversionMethod.oneTime:
        return await useOneTimeCredit();
      case ConversionMethod.needPurchase:
        return false;
    }
  }

  // 변환 제한 메시지
  String getConvertLimitMessage() {
    if (_isProUser) {
      return '무제한 AI 변환 가능 (PRO)';
    } else if (_freeAiConvertsLeft > 0) {
      return '오늘 $_freeAiConvertsLeft회 무료 AI 변환 가능';
    } else if (_oneTimeCredits > 0) {
      return '$_oneTimeCredits개의 1회 변환권 보유';
    } else {
      return 'AI 변환은 PRO 구독 또는 1회 변환권으로 이용 가능';
    }
  }

  // 변환권 상태 텍스트
  String getCreditsStatusText() {
    final parts = <String>[];
    
    if (_isProUser) {
      parts.add('PRO 무제한');
    } else {
      if (_freeAiConvertsLeft > 0) {
        parts.add('무료 $_freeAiConvertsLeft회');
      }
      if (_oneTimeCredits > 0) {
        parts.add('변환권 $_oneTimeCredits개');
      }
    }
    
    return parts.isEmpty ? '변환권 없음' : parts.join(' + ');
  }

  // 구독 상태 업데이트
  Future<void> refreshSubscriptionStatus() async {
    await purchaseService.refreshSubscriptionStatus(); // 실제 구독 상태 확인
    await _checkProStatus();
  }

  // 구독 상태 및 변환권 새로고침
  Future<void> refreshAll() async {
    await purchaseService.refreshSubscriptionStatus(); // 실제 구독 상태 확인
    await _checkProStatus();
    await _loadOneTimeCredits();
  }

  // 구매 스트림 리스너 설정 (샌드박스 테스트 필수)
  void _setupPurchaseListener() {
    purchaseService.listenToPurchaseUpdated((purchaseDetailsList) async {
      debugPrint('📱 구매 스트림 업데이트: ${purchaseDetailsList.length}개 항목');
      
      for (final purchaseDetails in purchaseDetailsList) {
        debugPrint('📱 구매 상태: ${purchaseDetails.status} - ${purchaseDetails.productID}');
        
        // 구매 검증 및 상태 업데이트
        await purchaseService.verifyAndUpdatePurchase(purchaseDetails);
        
        // 구매 완료 처리
        await purchaseService.completePurchase(purchaseDetails);
        
        // 앱 상태 새로고침
        await refreshAll();
      }
    });
  }

  // 앱 상태 리셋 (개발용)
  Future<void> resetAppState() async {
    _isProUser = false;
    _freeAiConvertsLeft = 1;
    _oneTimeCredits = 0;
    _lastFreeConvertDate = null;
    _currentFileId = null;
    _errorMessage = null;
    
    await _saveUserState();
    notifyListeners();
  }
}

// 변환 방법 열거형
enum ConversionMethod {
  pro,          // PRO 구독
  free,         // 무료 1회
  oneTime,      // 1회 변환권
  needPurchase, // 구매 필요
}