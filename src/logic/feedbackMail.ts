export const FEEDBACK_ADDRESS = 'bykeh1sy@mail.grokbot.com';

export function feedbackBody(input: {
  message: string;
  name?: string;
  email?: string;
  version: string;
  platform: string;
  device?: string;
}): string {
  return [
    input.message.trim(),
    '',
    `Name: ${input.name?.trim() || '(not given)'}`,
    `Email: ${input.email?.trim() || '(not given)'}`,
    `Version: ${input.version}`,
    `Platform: ${input.platform}`,
    `Device: ${input.device?.trim() || '(unknown)'}`,
  ].join('\n');
}

export function feedbackMailto(body: string): string {
  return `mailto:${FEEDBACK_ADDRESS}?subject=${encodeURIComponent('Christmas Family feedback')}&body=${encodeURIComponent(body)}`;
}
