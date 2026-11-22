import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

export async function tap(kind: 'light' | 'success' | 'warn' = 'light') {
  try {
    if (kind === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'warn') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else await Haptics.selectionAsync();
  } catch {
    // Haptics are missing on some devices and browsers.
  }
}

export async function shareText(message: string) {
  try {
    const result = await Share.share({ message });
    if (result.action === Share.dismissedAction) await Clipboard.setStringAsync(message);
  } catch {
    await Clipboard.setStringAsync(message);
  }
}
