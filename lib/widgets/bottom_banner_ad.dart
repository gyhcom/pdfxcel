import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../services/admob_service.dart';

class BottomBannerAd extends StatefulWidget {
  const BottomBannerAd({super.key});

  @override
  State<BottomBannerAd> createState() => _BottomBannerAdState();
}

class _BottomBannerAdState extends State<BottomBannerAd> {
  BannerAd? _bannerAd;
  bool _isAdLoaded = false;

  @override
  void initState() {
    super.initState();
    _loadBannerAd();
  }

  void _loadBannerAd() {
    _bannerAd = adMobService.createBannerAd(
      size: AdSize.banner,
      onAdLoaded: (ad) {
        setState(() {
          _isAdLoaded = true;
        });
        debugPrint('✅ 배너 광고 로드 완료');
      },
      onAdFailedToLoad: (ad, error) {
        setState(() {
          _isAdLoaded = false;
        });
        debugPrint('❌ 배너 광고 로드 실패: $error');
        ad.dispose();
        
        // 5초 후 재시도
        Future.delayed(const Duration(seconds: 5), () {
          if (mounted) {
            _loadBannerAd();
          }
        });
      },
    );

    _bannerAd?.load();
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isAdLoaded || _bannerAd == null) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      height: _bannerAd!.size.height.toDouble(),
      color: Colors.grey[100],
      child: AdWidget(ad: _bannerAd!),
    );
  }
}