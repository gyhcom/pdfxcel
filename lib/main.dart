import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'services/admob_service.dart';
import 'services/purchase_service.dart';
import 'providers/app_state_provider.dart';
import 'screens/home_screen.dart';
import 'screens/loading_screen.dart';

// 커스텀 색상 확장
@immutable
class _CustomColors extends ThemeExtension<_CustomColors> {
  const _CustomColors({
    required this.success,
    required this.warning,
    required this.info,
    required this.neutral,
    required this.lightGray,
    required this.darkGray,
  });

  final Color success;
  final Color warning;
  final Color info;
  final Color neutral;
  final Color lightGray;
  final Color darkGray;

  @override
  _CustomColors copyWith({
    Color? success,
    Color? warning,
    Color? info,
    Color? neutral,
    Color? lightGray,
    Color? darkGray,
  }) {
    return _CustomColors(
      success: success ?? this.success,
      warning: warning ?? this.warning,
      info: info ?? this.info,
      neutral: neutral ?? this.neutral,
      lightGray: lightGray ?? this.lightGray,
      darkGray: darkGray ?? this.darkGray,
    );
  }

  @override
  _CustomColors lerp(ThemeExtension<_CustomColors>? other, double t) {
    if (other is! _CustomColors) {
      return this;
    }
    return _CustomColors(
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      info: Color.lerp(info, other.info, t)!,
      neutral: Color.lerp(neutral, other.neutral, t)!,
      lightGray: Color.lerp(lightGray, other.lightGray, t)!,
      darkGray: Color.lerp(darkGray, other.darkGray, t)!,
    );
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 세로 방향 고정
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Google Mobile Ads 초기화
  await MobileAds.instance.initialize();
  
  runApp(const PDFXcelApp());
}

class PDFXcelApp extends StatelessWidget {
  const PDFXcelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => AppStateProvider(),
      child: MaterialApp(
        title: 'PDFXcel',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF7C6AFF), // 아이콘의 보라색과 일치
            brightness: Brightness.light,
            primary: const Color(0xFF7C6AFF),
            secondary: const Color(0xFF8B5CF6),
            tertiary: const Color(0xFF06B6D4),
            surface: const Color(0xFFFAFAFA),
            onPrimary: Colors.white,
            onSecondary: Colors.white,
            onSurface: const Color(0xFF1F2937),
            // 커스텀 색상들
            error: const Color(0xFFEF4444),
            onError: Colors.white,
            outline: const Color(0xFFE5E7EB),
            outlineVariant: const Color(0xFFF3F4F6),
            surfaceContainerHighest: const Color(0xFFF8F9FA),
            onSurfaceVariant: const Color(0xFF6B7280),
          ),
          // 추가 색상 확장
          extensions: [
            _CustomColors(
              success: const Color(0xFF10B981),
              warning: const Color(0xFFEAB308),
              info: const Color(0xFF3B82F6),
              neutral: const Color(0xFF6B7280),
              lightGray: const Color(0xFFF8F9FA),
              darkGray: const Color(0xFF1F2937),
            ),
          ],
          useMaterial3: true,
          // fontFamily: 'SF Pro Display', // 폰트가 없는 경우 주석 처리
          textTheme: const TextTheme(
            displayLarge: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.5,
              height: 1.2,
            ),
            displayMedium: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.5,
              height: 1.2,
            ),
            headlineLarge: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.3,
              height: 1.3,
            ),
            headlineMedium: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.2,
              height: 1.3,
            ),
            titleLarge: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.1,
              height: 1.4,
            ),
            bodyLarge: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.normal,
              height: 1.5,
            ),
            bodyMedium: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.normal,
              height: 1.5,
            ),
            bodySmall: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.normal,
              height: 1.4,
            ),
          ),
          appBarTheme: const AppBarTheme(
            centerTitle: false,
            elevation: 0,
            scrolledUnderElevation: 1,
            backgroundColor: Color(0xFFFAFAFA),
            surfaceTintColor: Colors.transparent,
            titleTextStyle: TextStyle(
              color: Color(0xFF1F2937),
              fontSize: 20,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.2,
            ),
            iconTheme: IconThemeData(
              color: Color(0xFF6B7280),
              size: 24,
            ),
            systemOverlayStyle: SystemUiOverlayStyle.dark,
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              elevation: 0,
              shadowColor: Colors.transparent,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              textStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.1,
              ),
            ),
          ),
          filledButtonTheme: FilledButtonThemeData(
            style: FilledButton.styleFrom(
              elevation: 0,
              shadowColor: Colors.transparent,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              textStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.1,
              ),
            ),
          ),
          outlinedButtonTheme: OutlinedButtonThemeData(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              side: const BorderSide(
                color: Color(0xFFE5E7EB),
                width: 1.5,
              ),
              textStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.1,
              ),
            ),
          ),
          cardTheme: CardThemeData(
            elevation: 0,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(
                color: Colors.grey.shade200,
                width: 1,
              ),
            ),
            color: Colors.white,
            surfaceTintColor: Colors.transparent,
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: const Color(0xFFF9FAFB),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(
                color: Color(0xFFE5E7EB),
                width: 1.5,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(
                color: Color(0xFFE5E7EB),
                width: 1.5,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(
                color: Color(0xFF7C6AFF),
                width: 2,
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
          chipTheme: ChipThemeData(
            backgroundColor: const Color(0xFFF3F4F6),
            selectedColor: const Color(0xFF7C6AFF),
            disabledColor: const Color(0xFFE5E7EB),
            labelStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            side: BorderSide.none,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          ),
          snackBarTheme: SnackBarThemeData(
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
            backgroundColor: const Color(0xFF1F2937),
            contentTextStyle: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          dialogTheme: DialogThemeData(
            elevation: 0,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            backgroundColor: Colors.white,
            surfaceTintColor: Colors.transparent,
            titleTextStyle: const TextStyle(
              color: Color(0xFF1F2937),
              fontSize: 20,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.2,
            ),
            contentTextStyle: const TextStyle(
              color: Color(0xFF6B7280),
              fontSize: 16,
              height: 1.5,
            ),
          ),
          dividerTheme: const DividerThemeData(
            color: Color(0xFFF3F4F6),
            thickness: 1,
            space: 1,
          ),
        ),
        home: const AppInitializer(),
      ),
    );
  }
}

class AppInitializer extends StatefulWidget {
  const AppInitializer({super.key});

  @override
  State<AppInitializer> createState() => _AppInitializerState();
}

class _AppInitializerState extends State<AppInitializer> {
  bool _isInitialized = false;
  String _initStatus = '앱을 초기화하는 중...';

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      // AdMob 서비스 초기화
      setState(() => _initStatus = 'AdMob 초기화 중...');
      await adMobService.initialize();
      
      // 구매 서비스 초기화
      setState(() => _initStatus = 'RevenueCat 초기화 중...');
      await purchaseService.initialize();
      
      // 앱 상태 초기화
      setState(() => _initStatus = '사용자 설정 로드 중...');
      if (mounted) {
        await Provider.of<AppStateProvider>(context, listen: false).initialize();
      }
      
      setState(() {
        _isInitialized = true;
        _initStatus = '초기화 완료!';
      });
      
      // 잠깐 로딩 화면 표시 후 메인 화면으로 이동
      await Future.delayed(const Duration(milliseconds: 500));
      
    } catch (error) {
      debugPrint('앱 초기화 실패: $error');
      setState(() {
        _isInitialized = true; // 실패해도 앱은 실행
        _initStatus = '초기화 중 오류 발생';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return LoadingScreen(message: _initStatus);
    }
    
    return const HomeScreen();
  }
}
