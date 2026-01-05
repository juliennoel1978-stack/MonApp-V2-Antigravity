import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

// Import translation files
import fr from '../locales/fr.json';
import en from '../locales/en.json';

const i18n = new I18n({
    fr,
    en,
});

// Set the locale once at the beginning of your app.
const deviceLanguage = getLocales()[0]?.languageCode ?? 'fr';
i18n.locale = deviceLanguage;

// When a value is missing from a language it'll fall back to another language with the key present.
i18n.enableFallback = true;
i18n.defaultLocale = 'fr';

export default i18n;
