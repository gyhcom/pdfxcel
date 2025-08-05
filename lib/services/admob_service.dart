import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class AdMobService {
  static final AdMobService _instance = AdMobService._internal();
  factory AdMobService() => _instance;
  AdMobService._internal();

  RewardedAd? _rewardedAd;
  InterstitialAd? _interstitialAd;
  bool _isRewardedAdLoaded = false;
  bool _isInterstitialAdLoaded = false;
  bool _isRewarded = false;

  // AdMob App ID (실제 프로덕션 ID) - Info.plist에서 사용

  static const Map<String, String> _adUnitIds = {
    // 프로덕션용 실제 광고 ID 사용 (kReleaseMode 기준)
    'rewarded_ios': kReleaseMode 
        ? 'ca-app-pub-4940948867704473/9569500075' // 실제 pdfxcel_reward
        : 'ca-app-pub-3940256099942544/1712485313', // 테스트 ID
    'rewarded_android': kReleaseMode 
        ? 'ca-app-pub-4940948867704473/9569500075'
        : 'ca-app-pub-3940256099942544/5224354917', // 테스트 ID  
    'interstitial_ios': kReleaseMode 
        ? 'ca-app-pub-4940948867704473/3804175689' // 실제 pdfxcel_ai
        : 'ca-app-pub-3940256099942544/4411468910', // 테스트 ID
    'interstitial_android': kReleaseMode 
        ? 'ca-app-pub-4940948867704473/3804175689'
        : 'ca-app-pub-3940256099942544/1033173712', // 테스트 ID
    'banner_ios': kReleaseMode 
        ? 'ca-app-pub-4940948867704473/5085467763' // 실제 pdfxcel_banner
        : 'ca-app-pub-3940256099942544/2934735716', // 테스트 ID
    'banner_android': kReleaseMode 
        ? 'ca-app-pub-4940948867704473/5085467763'
        : 'ca-app-pub-3940256099942544/6300978111', // 테스트 ID
  };

  // Getter for ad unit IDs
  String get rewardedAdUnitId {
    return Platform.isIOS 
        ? _adUnitIds['rewarded_ios']! 
        : _adUnitIds['rewarded_android']!;
  }

  String get interstitialAdUnitId {
    return Platform.isIOS 
        ? _adUnitIds['interstitial_ios']! 
        : _adUnitIds['interstitial_android']!;
  }

  String get bannerAdUnitId {
    return Platform.isIOS 
        ? _adUnitIds['banner_ios']! 
        : _adUnitIds['banner_android']!;
  }

  // AdMob 초기화
  Future<void> initialize() async {
    try {
      debugPrint('🎯 AdMob 초기화 시작...');
      await MobileAds.instance.initialize();
      debugPrint('✅ AdMob 초기화 완료');
      
      debugPrint('🎯 광고 단위 ID 확인:');
      debugPrint('- 리워드: $rewardedAdUnitId');
      debugPrint('- 전면: $interstitialAdUnitId');
      debugPrint('- 배너: $bannerAdUnitId');
      
      await _loadRewardedAd();
      await _loadInterstitialAd();
    } catch (error) {
      debugPrint('❌ AdMob 초기화 실패: $error');
    }
  }

  // 리워드 광고 로드 (재시도 로직 포함)
  Future<void> _loadRewardedAd({int retryCount = 0}) async {
    try {
      debugPrint('🎯 리워드 광고 로드 시작...');
      
      await RewardedAd.load(
        adUnitId: rewardedAdUnitId,
        request: const AdRequest(
          keywords: ['pdf', 'excel', 'document', 'conversion'],
          nonPersonalizedAds: false,
        ),
        rewardedAdLoadCallback: RewardedAdLoadCallback(
          onAdLoaded: (RewardedAd ad) {
            debugPrint('🎯 리워드 광고 로드 완료');
            _rewardedAd = ad;
            _isRewardedAdLoaded = true;
            
            // 광고 이벤트 리스너 설정
            _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
              onAdShowedFullScreenContent: (RewardedAd ad) {
                debugPrint('📱 리워드 광고 표시됨');
              },
              onAdDismissedFullScreenContent: (RewardedAd ad) {
                debugPrint('📱 리워드 광고 닫힘');
                ad.dispose();
                _rewardedAd = null;
                _isRewardedAdLoaded = false;
                // 3초 후 새로운 광고 로드
                Future.delayed(const Duration(seconds: 3), () => _loadRewardedAd());
              },
              onAdFailedToShowFullScreenContent: (RewardedAd ad, AdError error) {
                debugPrint('❌ 리워드 광고 표시 실패: $error');
                ad.dispose();
                _rewardedAd = null;
                _isRewardedAdLoaded = false;
              },
            );
          },
          onAdFailedToLoad: (LoadAdError error) {
            debugPrint('❌ 리워드 광고 로드 실패: $error');
            _isRewardedAdLoaded = false;
            
            // 네트워크 에러시 재시도 (최대 3회)
            if (error.code == 1 && retryCount < 3) { // Code 1: INTERNAL_ERROR (often network)
              debugPrint('🔄 리워드 광고 재시도 ${retryCount + 1}/3');
              Future.delayed(
                const Duration(seconds: 5), 
                () => _loadRewardedAd(retryCount: retryCount + 1)
              );
            }
          },
        ),
      );
    } catch (error) {
      debugPrint('❌ 리워드 광고 로드 예외: $error');
      _isRewardedAdLoaded = false;
    }
  }

  // 전면 광고 로드 (재시도 로직 포함)
  Future<void> _loadInterstitialAd({int retryCount = 0}) async {
    try {
      debugPrint('🎯 전면 광고 로드 시작...');
      
      await InterstitialAd.load(
        adUnitId: interstitialAdUnitId,
        request: const AdRequest(
          keywords: ['pdf', 'excel', 'ai', 'conversion'],
          nonPersonalizedAds: false,
        ),
        adLoadCallback: InterstitialAdLoadCallback(
          onAdLoaded: (InterstitialAd ad) {
            debugPrint('🎯 전면 광고 로드 완료');
            _interstitialAd = ad;
            _isInterstitialAdLoaded = true;
            
            // 광고 이벤트 리스너 설정
            _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
              onAdShowedFullScreenContent: (InterstitialAd ad) {
                debugPrint('📱 전면 광고 표시됨');
              },
              onAdDismissedFullScreenContent: (InterstitialAd ad) {
                debugPrint('📱 전면 광고 닫힘');
                ad.dispose();
                _interstitialAd = null;
                _isInterstitialAdLoaded = false;
                // 3초 후 새로운 광고 로드
                Future.delayed(const Duration(seconds: 3), () => _loadInterstitialAd());
              },
              onAdFailedToShowFullScreenContent: (InterstitialAd ad, AdError error) {
                debugPrint('❌ 전면 광고 표시 실패: $error');
                ad.dispose();
                _interstitialAd = null;
                _isInterstitialAdLoaded = false;
              },
            );
          },
          onAdFailedToLoad: (LoadAdError error) {
            debugPrint('❌ 전면 광고 로드 실패: $error');
            _isInterstitialAdLoaded = false;
            
            // 네트워크 에러시 재시도 (최대 3회)
            if (error.code == 1 && retryCount < 3) {
              debugPrint('🔄 전면 광고 재시도 ${retryCount + 1}/3');
              Future.delayed(
                const Duration(seconds: 5), 
                () => _loadInterstitialAd(retryCount: retryCount + 1)
              );
            }
          },
        ),
      );
    } catch (error) {
      debugPrint('❌ 전면 광고 로드 예외: $error');
      _isInterstitialAdLoaded = false;
    }
  }

  // 리워드 광고 표시
  Future<bool> showRewardedAd() async {
    try {
      if (!_isRewardedAdLoaded || _rewardedAd == null) {
        debugPrint('⚠️ 리워드 광고가 로드되지 않음');
        return false;
      }

      debugPrint('🎯 리워드 광고 표시 시작...');
      _isRewarded = false;

      await _rewardedAd!.show(
        onUserEarnedReward: (AdWithoutView ad, RewardItem reward) {
          debugPrint('🎉 리워드 획득: ${reward.amount} ${reward.type}');
          _isRewarded = true;
        },
      );

      // 광고가 닫힐 때까지 대기
      while (_rewardedAd != null) {
        await Future.delayed(const Duration(milliseconds: 100));
      }

      debugPrint('✅ 리워드 광고 완료 - 보상 획득: $_isRewarded');
      return _isRewarded;

    } catch (error) {
      debugPrint('❌ 리워드 광고 표시 실패: $error');
      return false;
    }
  }

  // 전면 광고 표시
  Future<bool> showInterstitialAd() async {
    try {
      if (!_isInterstitialAdLoaded || _interstitialAd == null) {
        debugPrint('⚠️ 전면 광고가 로드되지 않음');
        return false;
      }

      debugPrint('🎯 전면 광고 표시 시작...');
      
      await _interstitialAd!.show();

      // 광고가 닫힐 때까지 대기
      while (_interstitialAd != null) {
        await Future.delayed(const Duration(milliseconds: 100));
      }

      debugPrint('✅ 전면 광고 완료');
      return true;

    } catch (error) {
      debugPrint('❌ 전면 광고 표시 실패: $error');
      return false;
    }
  }

  // 배너 광고 생성
  BannerAd createBannerAd({
    required AdSize size,
    required void Function(Ad ad, LoadAdError error) onAdFailedToLoad,
    required void Function(Ad ad) onAdLoaded,
  }) {
    return BannerAd(
      adUnitId: bannerAdUnitId,
      size: size,
      request: const AdRequest(
        keywords: ['pdf', 'excel', 'document'],
        nonPersonalizedAds: false,
      ),
      listener: BannerAdListener(
        onAdLoaded: onAdLoaded,
        onAdFailedToLoad: onAdFailedToLoad,
        onAdOpened: (Ad ad) => debugPrint('📱 배너 광고 열림'),
        onAdClosed: (Ad ad) => debugPrint('📱 배너 광고 닫힘'),
        onAdClicked: (Ad ad) => debugPrint('👆 배너 광고 클릭됨'),
      ),
    );
  }

  // 광고 상태 확인
  bool get isRewardedAdReady => _isRewardedAdLoaded;
  bool get isInterstitialAdReady => _isInterstitialAdLoaded;

  // 수동으로 광고 다시 로드
  Future<void> reloadAds() async {
    debugPrint('🔄 광고 수동 재로드...');
    await _loadRewardedAd();
    await _loadInterstitialAd();
  }

  // 리소스 해제
  void dispose() {
    _rewardedAd?.dispose();
    _interstitialAd?.dispose();
    _rewardedAd = null;
    _interstitialAd = null;
    _isRewardedAdLoaded = false;
    _isInterstitialAdLoaded = false;
  }
}

// 싱글톤 인스턴스 export
final adMobService = AdMobService();