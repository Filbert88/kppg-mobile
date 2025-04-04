import { PermissionsAndroid, Platform, Alert } from 'react-native';

export const requestPhotoPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const permission =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    try {
      const granted = await PermissionsAndroid.request(permission, {
        title: 'Photo Permission',
        message: 'App needs access to your photo library',
        buttonPositive: 'OK',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      Alert.alert('Permission error', 'Failed to request permission');
      return false;
    }
  }
  return true;
};
