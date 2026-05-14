import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

// TODO: Replace with your actual GitHub details
const GITHUB_OWNER = 'YOUR_GITHUB_USERNAME'; 
const GITHUB_REPO = 'one-admin';

export const checkAppUpdate = async () => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    );
    const data = await response.json();

    if (data.tag_name) {
      const latestVersion = data.tag_name.replace('v', '');
      const currentVersion = Constants.expoConfig?.version || '1.0.0';

      // Simple version comparison (e.g., 1.1.0 > 1.0.0)
      if (isNewerVersion(latestVersion, currentVersion)) {
        const downloadUrl = data.assets?.[0]?.browser_download_url || data.html_url;
        
        Alert.alert(
          'Update Available 🚀',
          `A new version (${data.tag_name}) is available. Would you like to download it now?`,
          [
            { text: 'Later', style: 'cancel' },
            { 
              text: 'Download', 
              onPress: () => Linking.openURL(downloadUrl) 
            },
          ]
        );
      }
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
};

const isNewerVersion = (latest: string, current: string) => {
  const latestParts = latest.split('.').map(Number);
  const currentParts = current.split('.').map(Number);

  for (let i = 0; i < latestParts.length; i++) {
    if (latestParts[i] > (currentParts[i] || 0)) return true;
    if (latestParts[i] < (currentParts[i] || 0)) return false;
  }
  return false;
};
