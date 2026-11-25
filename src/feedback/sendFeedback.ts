import { Linking } from 'react-native';

import { FEEDBACK_ADDRESS, feedbackMailto } from '@/src/logic/feedbackMail';

export async function sendFeedback(body: string): Promise<'composer' | 'mailto'> {
  try {
    const MailComposer = await import('expo-mail-composer');
    if (await MailComposer.isAvailableAsync()) {
      await MailComposer.composeAsync({
        recipients: [FEEDBACK_ADDRESS],
        subject: 'Christmas Family feedback',
        body,
      });
      return 'composer';
    }
  } catch {
    // The composer is missing on the web build. Fall through to mailto.
  }
  await Linking.openURL(feedbackMailto(body));
  return 'mailto';
}
