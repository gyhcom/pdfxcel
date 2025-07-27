import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

export interface FilePickerResult {
  uri: string;
  name: string;
  size: number;
}

export class FileUtils {
  
  static async pickPdfFile(): Promise<FilePickerResult | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        return {
          uri: file.uri,
          name: file.name,
          size: file.size || 0,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('오류', 'PDF 파일을 선택하는 중 오류가 발생했습니다.');
      return null;
    }
  }

  static async shareFile(fileUri: string, filename: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('오류', '파일 공유가 지원되지 않는 기기입니다.');
        return;
      }

      await Sharing.shareAsync(fileUri, {
        dialogTitle: `${filename} 공유`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('오류', '파일 공유 중 오류가 발생했습니다.');
    }
  }

  static async saveToGallery(fileUri: string, filename: string): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // iOS에서는 Files 앱에 저장
        await this.shareFile(fileUri, filename);
        return true;
      }

      // Android에서는 미디어 라이브러리에 저장
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('권한 필요', '파일을 저장하려면 저장소 권한이 필요합니다.');
        return false;
      }

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      const album = await MediaLibrary.getAlbumAsync('Downloads');
      
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Downloads', asset, false);
      }

      Alert.alert('완료', `${filename}이 Downloads 폴더에 저장되었습니다.`);
      return true;

    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('오류', '파일 저장 중 오류가 발생했습니다.');
      return false;
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isValidPdfFile(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }
}

export const fileUtils = FileUtils;