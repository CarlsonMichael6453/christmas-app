import { describe, expect, it } from 'vitest';

import { defaultLightId, findLights, lightOptions } from '@/src/theme/lights';

describe('string light options', () => {
  it('includes none and the named garlands', () => {
    const names = lightOptions.map((option) => option.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'None',
        'Classic multicolor',
        'Warm white',
        'Cool white',
        'All red',
        'All green',
        'Red & green',
        'Red & white',
        'Icy blue',
        'Blue & white',
        'Gold',
        'Silver',
        'Purple',
        'Pink',
        'Rainbow',
        'Retro C9',
        'Peppermint',
        'Frosty pastels',
        'Evergreen & gold',
        'Hanukkah blue & silver',
        'Twinkling fade',
      ]),
    );
    expect(new Set(lightOptions.map((option) => option.id)).size).toBe(lightOptions.length);
    expect(lightOptions.find((option) => option.id === 'none')?.colors).toEqual([]);
    expect(lightOptions.filter((option) => option.id !== 'none').every((option) => option.colors.length > 0)).toBe(true);
    expect(findLights('missing').id).toBe(defaultLightId);
  });
});
