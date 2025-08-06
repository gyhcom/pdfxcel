import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ja.dart';
import 'app_localizations_ko.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ja'),
    Locale('ko'),
    Locale('zh'),
  ];

  /// The title of the application
  ///
  /// In en, this message translates to:
  /// **'PDFXcel'**
  String get appTitle;

  /// Main page title
  ///
  /// In en, this message translates to:
  /// **'PDF to Excel Converter'**
  String get homeTitle;

  /// Button text for selecting PDF file
  ///
  /// In en, this message translates to:
  /// **'Select PDF File'**
  String get selectPdfFile;

  /// Button text for starting conversion
  ///
  /// In en, this message translates to:
  /// **'Convert Now'**
  String get convertNow;

  /// AI conversion option
  ///
  /// In en, this message translates to:
  /// **'AI Conversion'**
  String get aiConversion;

  /// Basic conversion option
  ///
  /// In en, this message translates to:
  /// **'Basic Conversion'**
  String get basicConversion;

  /// PRO subscription title
  ///
  /// In en, this message translates to:
  /// **'PRO Subscription'**
  String get proSubscription;

  /// Monthly subscription plan
  ///
  /// In en, this message translates to:
  /// **'Monthly Plan'**
  String get monthlyPlan;

  /// Annual subscription plan
  ///
  /// In en, this message translates to:
  /// **'Annual Plan'**
  String get annualPlan;

  /// One-time conversion credit
  ///
  /// In en, this message translates to:
  /// **'1-Time Credit'**
  String get oneTimeCredit;

  /// PRO subscription benefits
  ///
  /// In en, this message translates to:
  /// **'Unlimited conversions + Ad removal'**
  String get unlimitedConversions;

  /// One-time credit description
  ///
  /// In en, this message translates to:
  /// **'High-quality AI conversion for 1 use'**
  String get highQualityAiConversion;

  /// Button text for purchasing one-time credit
  ///
  /// In en, this message translates to:
  /// **'Purchase 1-Time Credit'**
  String get purchaseOneTimeCredit;

  /// Button text for restoring purchases
  ///
  /// In en, this message translates to:
  /// **'Restore Purchases'**
  String get restorePurchases;

  /// Conversion in progress text
  ///
  /// In en, this message translates to:
  /// **'Converting...'**
  String get converting;

  /// Conversion success message
  ///
  /// In en, this message translates to:
  /// **'Conversion Complete!'**
  String get conversionComplete;

  /// Conversion error message
  ///
  /// In en, this message translates to:
  /// **'Conversion Failed'**
  String get conversionFailed;

  /// Button text for downloading Excel file
  ///
  /// In en, this message translates to:
  /// **'Download Excel'**
  String get downloadExcel;

  /// File upload dialog title
  ///
  /// In en, this message translates to:
  /// **'File Upload Guidelines'**
  String get fileUploadGuidelines;

  /// Supported file format section
  ///
  /// In en, this message translates to:
  /// **'Supported Format'**
  String get supportedFormat;

  /// Supported file format description
  ///
  /// In en, this message translates to:
  /// **'PDF files only'**
  String get pdfFilesOnly;

  /// File size limit section
  ///
  /// In en, this message translates to:
  /// **'File Size'**
  String get fileSize;

  /// Maximum file size description
  ///
  /// In en, this message translates to:
  /// **'Maximum 50MB'**
  String get maxFileSize;

  /// Optimal file type section
  ///
  /// In en, this message translates to:
  /// **'Optimal Files'**
  String get optimalFiles;

  /// Optimal file description
  ///
  /// In en, this message translates to:
  /// **'PDFs containing tables or data'**
  String get tablesAndData;

  /// Privacy section
  ///
  /// In en, this message translates to:
  /// **'Privacy'**
  String get privacy;

  /// Privacy guideline
  ///
  /// In en, this message translates to:
  /// **'Remove sensitive information before upload'**
  String get removeSensitiveInfo;

  /// Network requirement message
  ///
  /// In en, this message translates to:
  /// **'Internet connection required'**
  String get internetRequired;

  /// AI server requirement description
  ///
  /// In en, this message translates to:
  /// **'PDF conversion requires AI server'**
  String get aiServerRequired;

  /// Offline mode banner text
  ///
  /// In en, this message translates to:
  /// **'Offline Mode • Internet connection required for PDF conversion'**
  String get offlineMode;

  /// Offline available actions title
  ///
  /// In en, this message translates to:
  /// **'Available offline:'**
  String get availableOffline;

  /// Offline action - view history
  ///
  /// In en, this message translates to:
  /// **'View conversion history'**
  String get viewHistory;

  /// Offline action - download files
  ///
  /// In en, this message translates to:
  /// **'Download previous files'**
  String get downloadFiles;

  /// Offline action - view guide
  ///
  /// In en, this message translates to:
  /// **'View usage guide'**
  String get viewGuide;

  /// Offline action - app settings
  ///
  /// In en, this message translates to:
  /// **'App settings'**
  String get appSettings;

  /// Network error title
  ///
  /// In en, this message translates to:
  /// **'Network Error'**
  String get networkError;

  /// Network connection error message
  ///
  /// In en, this message translates to:
  /// **'Please check your internet connection'**
  String get checkConnection;

  /// File size error message
  ///
  /// In en, this message translates to:
  /// **'File too large (max 50MB)'**
  String get fileTooLarge;

  /// Invalid PDF error message
  ///
  /// In en, this message translates to:
  /// **'This is not a valid PDF file'**
  String get invalidPdf;

  /// Server error message
  ///
  /// In en, this message translates to:
  /// **'Server error occurred. Please try again later'**
  String get serverError;

  /// Purchase success message
  ///
  /// In en, this message translates to:
  /// **'Purchase completed successfully!'**
  String get purchaseComplete;

  /// Purchase failed message
  ///
  /// In en, this message translates to:
  /// **'Purchase failed. Please try again'**
  String get purchaseFailed;

  /// Cancel button text
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// Confirm button text
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get confirm;

  /// Retry button text
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// OK button text
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get ok;

  /// Settings title
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// Language setting
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// About section
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get about;

  /// App version
  ///
  /// In en, this message translates to:
  /// **'Version'**
  String get version;

  /// Privacy policy link
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get privacyPolicy;

  /// Terms of service link
  ///
  /// In en, this message translates to:
  /// **'Terms of Service'**
  String get termsOfService;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ja', 'ko', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'ja':
      return AppLocalizationsJa();
    case 'ko':
      return AppLocalizationsKo();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
