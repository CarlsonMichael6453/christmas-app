import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

export async function tap(kind: 'light' | 'success' | 'warn' = 'light') {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        const pattern = kind === 'success' ? [40, 100, 40] : kind === 'warn' ? [50, 100, 50] : [40];
        navigator.vibrate(pattern);
      }
      return;
    }
    if (kind === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'warn') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else await Haptics.selectionAsync();
  } catch {
    // Haptics are missing on some devices and browsers, including iOS Safari.
  }
}

export async function shareText(message: string) {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ text: message });
        return;
      }
      await Clipboard.setStringAsync(message);
      return;
    }
    const result = await Share.share({ message });
    if (result.action === Share.dismissedAction) await Clipboard.setStringAsync(message);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return;
    try {
      await Clipboard.setStringAsync(message);
    } catch {
      // Clipboard can be blocked outside a user gesture.
    }
  }
}
