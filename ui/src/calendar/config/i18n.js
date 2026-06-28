import dayjs from 'dayjs/esm';
import esLocale from 'dayjs/esm/locale/es.js';
import enLocale from 'dayjs/esm/locale/en.js';
import updateLocale from 'dayjs/esm/plugin/updateLocale';

dayjs.extend(updateLocale);

// Register locales explicitly
dayjs.locale('es', esLocale, false);
dayjs.locale('en', enLocale, false);

export function i18nConfiguration(namespaces) {
	return {
		debug: import.meta.env.DEV,
		fallbackLng: 'es',
		load: 'currentOnly',
		supportedLngs: [
			'en', 'es', 'ca', 'cs', 'da', 'de', 'fr', 'he', 'hr', 'hu',
			'it', 'ja', 'nb', 'nl', 'pl', 'pt-br', 'sl', 'sv', 'tr',
		],
		ns: namespaces,
		lowerCaseLng: true,
		interpolation: {
			escapeValue: false,
		},
	};
}

export function getFullySupportedLocales() {
	return [
		'en', 'es', 'ca', 'cs', 'da', 'de', 'fr', 'he', 'hr', 'hu',
		'it', 'ja', 'nb', 'nl', 'pl', 'pt-br', 'sl', 'sv', 'tr',
	];
}

export function getPartiallySupportedLocales() {
	return [];
}

export function handleLanguageChange(newLanguage, firstDayOfWeek = 1) {
	try {
		dayjs.locale(newLanguage);
		dayjs.updateLocale(newLanguage, {
			weekStart: firstDayOfWeek,
		});
	} catch(e) {
		// locale not available in this context
	}
}
