import { vi } from './locales/vi';

export type Language = 'vi' | 'en' | 'kr' | 'jp';

export type I18nDictionary = typeof vi;

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & string]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : Key;
}[keyof ObjectType & string];

export type I18nTranslationKey = NestedKeyOf<I18nDictionary>;

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: I18nTranslationKey) => string;
  isDetecting?: boolean;
}
