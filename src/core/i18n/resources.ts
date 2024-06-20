import bn from '@/translations/bn.json';
import en from '@/translations/en.json';

export const resources = {
  en: {
    translation: en,
  },
  bn: {
    translation: bn,
  },
};

export type Language = keyof typeof resources;
