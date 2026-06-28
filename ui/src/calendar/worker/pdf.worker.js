/* eslint-disable no-restricted-globals */
// MUST be first import: polyfills window for Vite's @react-refresh runtime
// which is injected into JSX files loaded by this worker.
import './worker-env-shim.js';
//
// pdf.worker.js - Genera el PDF del calendario en un Web Worker.
//
// IMPORTANTE: Aqui NO usamos initReactI18next ( el worker carga React via
// @react-pdf/renderer, que es una version interna sin useSyncExternalStore ).
// Solo inicializamos i18next plano con los recursos, suficiente para que
// las cadenas de traduccion se resuelvan al renderizar el PDF.
//
import i18n, { changeLanguage } from 'i18next';
import React from 'react';

import recalendarResources, { SUPPORTED_LANGS } from '~/lib/resources';
import '~/config/dayjs';
import { handleLanguageChange } from '~/config/i18n';
import { utf8ToBase64 } from '~/lib/base64';
import { Font, pdf } from '~/lib/pdf';
import PdfConfig, {
	hydrateFromObject,
	CONFIG_CURRENT_VERSION,
	CONFIG_FILE,
} from '~/pdf/config';
import { getCJKFontDefinition, getFontDefinition } from '~/pdf/lib/fonts';
import RecalendarPdf from '~/pdf/recalendar';
import { splitItemsByPages } from '~/pdf/utils';
import {
	ITINERARY_AGENDA,
	ITINERARY_TASKS,
	ITINERARY_NOTES,
} from '~/lib/itinerary-utils';
import dayjs from 'dayjs/esm';

// init i18next SIN react-i18next ( solo traducciones planas )
i18n.init( {
	lng: 'en',
	fallbackLng: 'en',
	supportedLngs: SUPPORTED_LANGS,
	ns: [ 'pdf', 'config' ],
	defaultNS: 'pdf',
	lowerCaseLng: true,
	resources: recalendarResources,
	interpolation: { escapeValue: false },
} );

function encodeConfig( data ) {
	const dataWithVersion = Object.assign(
		{ version: CONFIG_CURRENT_VERSION },
		data,
	);
	return (
		'data:text/plain;base64,' + utf8ToBase64( JSON.stringify( dataWithVersion ) )
	);
}

// Effectively disables hyphenation
function hyphenationCallback( word ) {
	return [ word ];
}

function calculatePageMap( config ) {
	const SPECIAL_TYPES = [ ITINERARY_AGENDA, ITINERARY_TASKS, ITINERARY_NOTES ];
	const pageMap = {};
	let pageNum = 0;

	// Year overview
	pageNum++;

	// Iterate weeks
	let currentDate = dayjs.utc( { year: config.year, month: config.month, day: 1 } );
	const endDate = currentDate.add( config.monthCount, 'months' );
	currentDate = currentDate.startOf( 'week' );

	while ( currentDate.isBefore( endDate ) ) {
		// Week overview
		if ( config.isWeekOverviewEnabled ) pageNum++;

		// Days in week
		const endOfWeek = currentDate.add( 1, 'weeks' );
		let day = currentDate.clone();
		while ( day.isBefore( endOfWeek ) ) {
			// Month overview
			if ( config.isMonthOverviewEnabled && day.date() === 1 ) pageNum++;

			// Day pages
			const dayConfig = config.dayItineraries[ day.weekday() ];
			if ( dayConfig && dayConfig.isEnabled ) {
				const pages = splitItemsByPages( dayConfig.items );
				for ( const pageItems of pages ) {
					const specialItem = pageItems.find( ( item ) =>
						SPECIAL_TYPES.includes( item.type )
					);
					if ( specialItem ) {
						const dateStr = day.format( 'YYYY-MM-DD' );
						if ( ! pageMap[ dateStr ] ) pageMap[ dateStr ] = {};
						pageMap[ dateStr ][ specialItem.type ] = pageNum;
					}
					pageNum++;
				}
			} else {
				pageNum++; // disabled day still gets a page
			}

			day = day.add( 1, 'day' );
		}

		// Week retrospective
		if ( config.isWeekRetrospectiveEnabled ) pageNum++;

		currentDate = currentDate.add( 1, 'weeks' );
	}

	return pageMap;
}

self.onmessage = async ( { data } ) => {
	try {
		console.log( '[pdf.worker] message received', {
			isPreview: data.isPreview,
			language: data.language,
		} );

		const config = new PdfConfig( hydrateFromObject( data ) );
		const { firstDayOfWeek, language, isPreview } = data;

		await changeLanguage( language );
		await handleLanguageChange( language, firstDayOfWeek );

		Font.registerHyphenationCallback( hyphenationCallback );
		Font.register( getFontDefinition( config.fontFamily ) );
		Font.register( getCJKFontDefinition() );
		Font.registerEmojiSource( {
			format: 'png',
			url: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/',
		} );

		const document = React.createElement(
			RecalendarPdf,
			{ isPreview, config },
			null,
		);
		pdf( document, {
			attachments: [
				{
					src: encodeConfig( data ),
					options: {
						name: CONFIG_FILE,
						type: 'application/json',
						hidden: false,
					},
				},
			],
		} )
			.toBlob()
			.then( ( blob ) => {
				console.log( '[pdf.worker] PDF generado, size:', blob.size );
				const pageMap = calculatePageMap( config );
				console.log( '[pdf.worker] pageMap:', Object.keys(pageMap).length, 'days' );
				self.postMessage( { blob, pageMap } );
			} )
			.catch( ( err ) => {
				console.error( '[pdf.worker] Error generando PDF:', err );
				self.postMessage( { error: err.message || String( err ) } );
			} );
	} catch ( err ) {
		console.error( '[pdf.worker] Error en onmessage:', err );
		self.postMessage( { error: err.message || String( err ) } );
	}
};
