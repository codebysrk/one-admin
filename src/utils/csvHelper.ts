import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const exportToCSV = async (data: any[], fileName: string) => {
  if (data.length === 0) {
    Alert.alert("Error", "No data to export");
    return;
  }

  try {
    // 1. Get headers
    const headers = Object.keys(data[0]);
    
    // 2. Convert to CSV string
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(item => 
        headers.map(header => {
          let val = item[header] || '';
          // Handle timestamps (Firestore object or Milliseconds)
          if (val && (typeof val === 'object' && val.toDate)) {
            val = val.toDate().toLocaleString();
          } else if (header.toLowerCase().includes('timestamp') && typeof val === 'number') {
            val = new Date(val).toLocaleString();
          }
          // Escape quotes and commas
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // 3. Create temporary file
    const fileUri = `${FileSystem.documentDirectory}${fileName}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });

    // 4. Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert("Success", `File saved to: ${fileUri}`);
    }
  } catch (error: any) {
    console.error("Export Error:", error);
    Alert.alert("Export Failed", error.message);
  }
};
