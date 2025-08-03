import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'services/admob_service.dart';
import 'services/purchase_service.dart';
import 'providers/app_state_provider.dart';
import 'screens/home_screen.dart';
import 'screens/loading_screen.dart';

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
            seedColor: const Color(0xFF2196F3), // 파란색 테마
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          fontFamily: 'NotoSans', // 한글 폰트 지원
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
            systemOverlayStyle: SystemUiOverlayStyle.dark,
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          cardTheme: CardThemeData(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
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
