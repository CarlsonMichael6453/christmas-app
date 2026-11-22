export type LightBulb = 'mini' | 'c9';
export type LightTwinkle = 'gentle' | 'fade';

export type LightOption = {
  id: string;
  name: string;
  colors: string[];
  bulb: LightBulb;
  twinkle: LightTwinkle;
};

export const lightOptions: LightOption[] = [
  { id: 'none', name: 'None', colors: [], bulb: 'mini', twinkle: 'gentle' },
  { id: 'classic', name: 'Classic multicolor', colors: ['#E74C3C', '#F1C40F', '#27AE60', '#5DADE2', '#BB8FCE'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'warm-white', name: 'Warm white', colors: ['#FFE4B5', '#FFF6E0', '#F6D7A8'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'cool-white', name: 'Cool white', colors: ['#F7FBFF', '#E8F4FF', '#FFFFFF'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'all-red', name: 'All red', colors: ['#C0392B', '#E74C3C', '#922B21'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'all-green', name: 'All green', colors: ['#196F3D', '#27AE60', '#145A32'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'red-green', name: 'Red & green', colors: ['#C0392B', '#1E8449'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'red-white', name: 'Red & white', colors: ['#E74C3C', '#FFFFFF'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'icy-blue', name: 'Icy blue', colors: ['#5DADE2', '#85C1E9', '#D6EAF8'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'blue-white', name: 'Blue & white', colors: ['#2E86C1', '#FFFFFF'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'gold', name: 'Gold', colors: ['#F1C40F', '#D4AC0D', '#F9E79F'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'silver', name: 'Silver', colors: ['#D5D8DC', '#AEB6BF', '#F4F6F7'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'purple', name: 'Purple', colors: ['#8E44AD', '#BB8FCE', '#6C3483'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'pink', name: 'Pink', colors: ['#F1948A', '#F5B7B1', '#E74C6F'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'rainbow', name: 'Rainbow', colors: ['#E74C3C', '#F39C12', '#F1C40F', '#27AE60', '#3498DB', '#8E44AD'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'retro-c9', name: 'Retro C9', colors: ['#E74C3C', '#27AE60', '#F1C40F', '#2980B9', '#F39C12'], bulb: 'c9', twinkle: 'gentle' },
  { id: 'peppermint', name: 'Peppermint', colors: ['#E74C3C', '#FFFFFF', '#F5B7B1'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'frosty-pastels', name: 'Frosty pastels', colors: ['#F5CBA7', '#D7BDE2', '#AED6F1', '#ABEBC6'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'evergreen-gold', name: 'Evergreen & gold', colors: ['#1E8449', '#F1C40F'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'hanukkah', name: 'Hanukkah blue & silver', colors: ['#1A5276', '#D5D8DC', '#5DADE2'], bulb: 'mini', twinkle: 'gentle' },
  { id: 'twinkling-fade', name: 'Twinkling fade', colors: ['#E74C3C', '#F1C40F', '#27AE60', '#5DADE2', '#FFFFFF'], bulb: 'mini', twinkle: 'fade' },
];

export const defaultLightId = 'classic';

export function findLights(id: string | null | undefined): LightOption {
  return lightOptions.find((entry) => entry.id === id) ?? lightOptions.find((entry) => entry.id === defaultLightId)!;
}

export function garlandHeight(option: LightOption): number {
  if (option.id === 'none') return 0;
  return option.bulb === 'c9' ? 52 : 40;
}
