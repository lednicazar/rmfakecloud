import {
	ITINERARY_NEW_PAGE,
	ITINERARY_AGENDA,
	ITINERARY_TASKS,
	ITINERARY_NOTES,
} from '~/lib/itinerary-utils';

const PAGE_BREAK_TYPES = [
	ITINERARY_NEW_PAGE,
	ITINERARY_AGENDA,
	ITINERARY_TASKS,
	ITINERARY_NOTES,
];

export function splitItemsByPages( items ) {
	const pages = [ [] ];
	let currentPageNumber = 0;
	for ( let i = 0; i < items.length; i++ ) {
		const { type } = items[ i ];
		if ( PAGE_BREAK_TYPES.includes( type ) ) {
			if ( type === ITINERARY_NEW_PAGE ) {
				// new_page solo crea pagina nueva si ya hay contenido
				if ( pages[ currentPageNumber ] && pages[ currentPageNumber ].length > 0 ) {
					currentPageNumber++;
				}
			} else {
				// agenda/tasks/notes: si la pagina actual esta vacia, la ponemos ahi
				// si ya tiene contenido, creamos pagina nueva
				if ( pages[ currentPageNumber ] && pages[ currentPageNumber ].length > 0 ) {
					currentPageNumber++;
				}
				if ( ! pages[ currentPageNumber ] ) {
					pages[ currentPageNumber ] = [];
				}
				pages[ currentPageNumber ].push( items[ i ] );
			}
			continue;
		}

		if ( ! pages[ currentPageNumber ] ) {
			pages[ currentPageNumber ] = [];
		}

		pages[ currentPageNumber ].push( items[ i ] );
	}

	// Eliminar paginas vacias al final
	while ( pages.length > 0 && pages[ pages.length - 1 ].length === 0 ) {
		pages.pop();
	}

	return pages;
}
