import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider extends ChangeNotifier {
  Locale _locale = const Locale('ko'); // 기본값은 한국어

  Locale get locale => _locale;

  // 지원하는 언어 목록
  static const List<Locale> supportedLocales = [
    Locale('ko'), // 한국어
    Locale('en'), // 영어
    Locale('ja'), // 일본어
    Locale('zh'), // 중국어 간체
  ];

  // 언어 이름 매핑
  static const Map<String, String> languageNames = {
    'ko': '한국어',
    'en': 'English',
    'ja': '日本語',
    'zh': '简体中文',
  };

  LanguageProvider() {
    _loadSavedLanguage();
  }

  // 저장된 언어 설정 로드
  Future<void> _loadSavedLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedLanguageCode = prefs.getString('language_code');
      
      if (savedLanguageCode != null) {
        final savedLocale = Locale(savedLanguageCode);
        if (supportedLocales.contains(savedLocale)) {
          _locale = savedLocale;
          notifyListeners();
        }
      } else {
        // 시스템 언어 감지 시도
        _detectSystemLanguage();
      }
    } catch (e) {
      debugPrint('언어 설정 로드 실패: $e');
    }
  }

  // 시스템 언어 감지
  void _detectSystemLanguage() {
    try {
      final systemLocales = WidgetsBinding.instance.platformDispatcher.locales;
      
      for (final systemLocale in systemLocales) {
        final matchingLocale = supportedLocales.firstWhere(
          (supportedLocale) => supportedLocale.languageCode == systemLocale.languageCode,
          orElse: () => const Locale('ko'), // 기본값
        );
        
        if (supportedLocales.contains(matchingLocale)) {
          _locale = matchingLocale;
          debugPrint('시스템 언어 감지: ${_locale.languageCode}');
          notifyListeners();
          return;
        }
      }
    } catch (e) {
      debugPrint('시스템 언어 감지 실패: $e');
    }
  }

  // 언어 변경
  Future<void> changeLanguage(Locale newLocale) async {
    if (_locale == newLocale) return;

    try {
      _locale = newLocale;
      
      // SharedPreferences에 저장
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('language_code', newLocale.languageCode);
      
      debugPrint('언어 변경됨: ${newLocale.languageCode}');
      notifyListeners();
    } catch (e) {
      debugPrint('언어 변경 실패: $e');
    }
  }

  // 언어 코드로 언어명 가져오기
  String getLanguageName(String languageCode) {
    return languageNames[languageCode] ?? languageCode;
  }

  // 현재 언어가 RTL(Right-to-Left)인지 확인
  bool get isRTL {
    return _locale.languageCode == 'ar' || _locale.languageCode == 'he';
  }

  // 현재 언어에 따른 폰트 설정 (필요시 확장 가능)
  String? get fontFamily {
    switch (_locale.languageCode) {
      case 'zh':
        return 'NotoSansCJK'; // 중국어 폰트
      case 'ja':
        return 'NotoSansCJK'; // 일본어 폰트
      default:
        return null; // 시스템 기본 폰트 사용
    }
  }

  // 숫자 포맷 (현지화)
  String formatNumber(int number) {
    switch (_locale.languageCode) {
      case 'ko':
        return '$number개';
      case 'ja':
        return '$number個';
      case 'zh':
        return '$number个';
      default:
        return number.toString();
    }
  }

  // 가격 표시 (현지화 - 실제 환율은 별도 API 필요)
  String formatPrice(double usdPrice) {
    switch (_locale.languageCode) {
      case 'ko':
        return '₩${(usdPrice * 1300).toInt().toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), 
          (Match m) => '${m[1]},'
        )}';
      case 'ja':
        return '¥${(usdPrice * 150).toInt()}';
      case 'zh':
        return '¥${(usdPrice * 7.2).toStringAsFixed(1)}';
      default:
        return '\$${usdPrice.toStringAsFixed(2)}';
    }
  }

  // 파일 크기 단위 현지화
  String formatFileSize(int bytes) {
    const suffixes = {
      'ko': ['B', 'KB', 'MB', 'GB'],
      'ja': ['B', 'KB', 'MB', 'GB'],
      'zh': ['B', 'KB', 'MB', 'GB'],
      'en': ['B', 'KB', 'MB', 'GB'],
    };

    final localSuffixes = suffixes[_locale.languageCode] ?? suffixes['en']!;
    
    if (bytes < 1024) return '$bytes${localSuffixes[0]}';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)}${localSuffixes[1]}';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)}${localSuffixes[2]}';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)}${localSuffixes[3]}';
  }
}