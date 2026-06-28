// Cargador de recursos i18n para recalendar (UI y worker).
// Evita el plugin virtual:i18next-loader que daba problemas de formato.

import dayjs from 'dayjs/esm';

const namespaces = ["app", "config", "pdf"];

// Pre-cargar TODOS los locales (UI + dayjs) de forma eager
// para que esten disponibles sincronamente en UI y worker.
const allLocaleModules = import.meta.glob("../locales/*/*.json", { eager: true });
const allDayjsLocales = import.meta.glob(
  "../../node_modules/dayjs/esm/locale/*.js",
  { eager: true }
);

// Registrar TODOS los locales de dayjs al cargar el modulo
for (const path in allDayjsLocales) {
  const match = path.match(/locale\/(.+)\.js$/);
  if (match) {
    const lang = match[1];
    const locale = allDayjsLocales[path];
    try {
      dayjs.locale(lang, locale.default || locale, false);
    } catch (e) {
      // ignorar locales problemáticos
    }
  }
}

function buildResources() {
  const resources = {};
  for (const path in allLocaleModules) {
    const match = path.match(/locales\/([^/]+)\/([^/]+)\.json$/);
    if (!match) continue;
    const [, lang, ns] = match;
    if (!namespaces.includes(ns)) continue;
    if (!resources[lang]) resources[lang] = {};
    const mod = allLocaleModules[path];
    resources[lang][ns] = (mod && mod.default) ? mod.default : mod;
  }
  return resources;
}

const RESOURCES = buildResources();

export const SUPPORTED_LANGS = Object.keys(RESOURCES);
export default RESOURCES;
