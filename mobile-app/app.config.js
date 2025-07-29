export default {
  expo: {
    name: "PDFXcel",
    slug: "pdfxcel",
    version: "1.0.0",
    owner: "konise", // 👈 추가 완료
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    packagerOpts: {
      config: "metro.config.js"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.pdfxcel.mobile",
      buildNumber: "1",
      deploymentTarget: "15.1",
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            "pdfxcel-production.up.railway.app": {
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSExceptionMinimumTLSVersion: "TLSv1.2",
              NSIncludesSubdomains: true
            }
          }
        },
        NSDocumentsFolderUsageDescription: "이 앱은 변환된 Excel 파일을 저장하기 위해 문서 폴더에 접근합니다.",
        NSPhotoLibraryUsageDescription: "PDF 파일을 선택하기 위해 사진 라이브러리에 접근합니다.",
        ITSAppUsesNonExemptEncryption: false,
        UIStatusBarStyle: "UIStatusBarStyleDefault",
        UIViewControllerBasedStatusBarAppearance: false
      },
      xcodeHeaderSearchPaths: [
        "$(SRCROOT)/../node_modules/react-native/Libraries/Image"
      ]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.pdfxcel.mobile",
      permissions: [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "MANAGE_DOCUMENTS"
      ],
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      usesCleartextTraffic: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-document-picker",
        {
          iCloudContainerEnvironment: "Production"
        }
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
          savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos.",
          isAccessMediaLocationEnabled: true
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "9fd64511-f848-4736-9468-e6f43d6497fe"
      }
    }
  }
};