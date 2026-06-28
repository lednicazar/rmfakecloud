import React, { Suspense, lazy, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import "~/config/dayjs";
import { handleLanguageChange, i18nConfiguration } from "~/config/i18n";
import recalendarResources from "~/lib/resources";

const RecalendarApp = lazy(() => import("./RecalendarApp"));

const LANGUAGE_KEY = "rmfakecloud_language";

let i18nInitialized = false;
function ensureI18n() {
  if (i18nInitialized) return;
  i18nInitialized = true;

  const savedLang = localStorage.getItem(LANGUAGE_KEY) || "es";

  i18n.on("languageChanged", (lng) => {
    console.log("[Calendar] languageChanged:", lng);
    handleLanguageChange(lng);
    localStorage.setItem(LANGUAGE_KEY, lng);
  });

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      ...i18nConfiguration(["app", "pdf", "config"]),
      resources: recalendarResources,
      react: { useSuspense: false },
      fallbackLng: "es",
      lng: savedLang,
    });

  // Force changeLanguage to trigger the event and update dayjs
  i18n.changeLanguage(savedLang);
}

export default function Calendar() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureI18n();
    if (i18n.isInitialized) {
      setReady(true);
    } else {
      i18n.on("initialized", () => setReady(true));
    }
  }, []);

  if (!ready) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="d-flex justify-content-center align-items-center h-100">
          <Spinner animation="border" />
        </div>
      }
    >
      <RecalendarApp />
    </Suspense>
  );
}
