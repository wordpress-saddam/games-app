import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from '../locales/en.json';
import arTranslations from '../locales/ar.json';

// Language storage key
const LANGUAGE_STORAGE_KEY = 'i18nextLng';

// Get saved language from localStorage or default to 'en'
const getSavedLanguage = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && (saved === 'en' || saved === 'ar')) {
      return saved;
    }
  }
  return 'en';
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ar: {
        translation: arTranslations,
      },
    },
    lng: getSavedLanguage(), // Default language
    fallbackLng: 'en', // Fallback language
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      // Keys to lookup language from
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      // Cache user language
      caches: ['localStorage'],
    },
  })
  .then(() => {
    // Initialize document direction after i18n is ready
    if (typeof window !== 'undefined') {
      const currentLang = i18n.language || getSavedLanguage();
      const isRTL = currentLang === 'ar';
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = currentLang;
    }
  });

// Function to change language and update document direction
export const changeLanguage = (lng) => {
  i18n.changeLanguage(lng);
  
  // Update localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    
    // Update document direction and language
    const isRTL = lng === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  }
};

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    const isRTL = lng === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  }
});

export default i18n;

