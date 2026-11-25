import { describe, expect, it } from 'vitest';

import { FEEDBACK_ADDRESS, feedbackBody, feedbackMailto } from '@/src/logic/feedbackMail';

describe('feedback mail', () => {
  it('includes the note plus version and device details', () => {
    const body = feedbackBody({
      message: 'The advent door was lovely.',
      name: 'Michael',
      version: '1.0.0',
      platform: 'ios',
      device: 'iPhone',
    });
    expect(body).toContain('The advent door was lovely.');
    expect(body).toContain('Name: Michael');
    expect(body).toContain('Email: (not given)');
    expect(body).toContain('Version: 1.0.0');
    expect(body).toContain('Platform: ios');
    expect(body).toContain('Device: iPhone');
  });

  it('builds a mailto link to the feedback address', () => {
    const href = feedbackMailto('Hello');
    expect(href.startsWith(`mailto:${FEEDBACK_ADDRESS}?`)).toBe(true);
    expect(decodeURIComponent(href)).toContain('Hello');
  });
});
