export default {
  expo: {
    name: "PDFXcel",
    slug: "pdfxcel",
    version: "1.0.0",
    owner: "konise", // 👈 추가 완료
    orientation: "portrait",
    icon: "./assets/adaptive-icon.png",
    userInterfaceStyle: "light",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.pdfxcel.mobile"
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
      targetSdkVersion: 34
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