import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./translations/en.json";
import ukTranslations from "./translations/uk.json";

i18n.use(initReactI18next).init({
  fallbackLng: "en",
  resources: {
    en: {
      translation: {
        appName: "electron-shadcn",
        titleHomePage: "Home Page",
        titleSecondPage: "Second Page",
        ...enTranslations,
      },
    },
    uk: {
      translation: {
        appName: "electron-shadcn",
        titleHomePage: "Головна сторінка",
        titleSecondPage: "Друга сторінка",
        ...ukTranslations,
      },
    },
  },
});
