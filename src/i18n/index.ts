import am from './locales/am.json';
import en from './locales/en.json';

export type SupportedLanguage = 'am' | 'en';

export const resources = {
  am: { translation: am },
  en: { translation: en },
} as const;

export interface TranslationDictionary {
  [key: string]: any;
}

class LocalizationService {
  private currentLanguage: SupportedLanguage = 'am';
  private translations: Record<SupportedLanguage, TranslationDictionary> = {
    am,
    en,
  };

  public setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Translates a dot-notated key (e.g. "medication.name_label")
   * Supports parameter interpolation e.g. {{days}}
   */
  public t(key: string, params?: Record<string, string | number>): string {
    const dict = this.translations[this.currentLanguage] || this.translations.am;
    const parts = key.split('.');
    let value: any = dict;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        // Fallback to English if missing in Amharic
        let fallbackVal: any = this.translations.en;
        for (const fPart of parts) {
          if (fallbackVal && typeof fallbackVal === 'object' && fPart in fallbackVal) {
            fallbackVal = fallbackVal[fPart];
          } else {
            fallbackVal = null;
            break;
          }
        }
        value = fallbackVal || key;
        break;
      }
    }

    if (typeof value === 'string' && params) {
      return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
        return str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramVal));
      }, value);
    }

    return typeof value === 'string' ? value : key;
  }
}

export const i18n = new LocalizationService();
export const t = (key: string, params?: Record<string, string | number>) =>
  i18n.t(key, params);
