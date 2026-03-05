import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enShip from './locales/en/ship.json';
import enCompliance from './locales/en/compliance.json';
import enVoyage from './locales/en/voyage.json';
import enScenario from './locales/en/scenario.json';
import enReport from './locales/en/report.json';

import elCommon from './locales/el/common.json';
import elShip from './locales/el/ship.json';
import elCompliance from './locales/el/compliance.json';
import elVoyage from './locales/el/voyage.json';
import elScenario from './locales/el/scenario.json';
import elReport from './locales/el/report.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        ship: enShip,
        compliance: enCompliance,
        voyage: enVoyage,
        scenario: enScenario,
        report: enReport,
      },
      el: {
        common: elCommon,
        ship: elShip,
        compliance: elCompliance,
        voyage: elVoyage,
        scenario: elScenario,
        report: elReport,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
