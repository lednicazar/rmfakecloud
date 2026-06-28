import { Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import dayjs from 'dayjs/esm';
import i18next from 'i18next';
import PropTypes from 'prop-types';
import React from 'react';

import {
	findByDate,
	DATE_FORMAT as SPECIAL_DATES_DATE_FORMAT,
} from '~/lib/special-dates-utils';
import {
	ITINERARY_AGENDA,
	ITINERARY_TASKS,
	ITINERARY_NOTES,
} from '~/lib/itinerary-utils';
import Header from '~/pdf/components/header';
import Itinerary from '~/pdf/components/itinerary';
import MiniCalendar from '~/pdf/components/mini-calendar';
import AgendaContent from '~/pdf/pages/agenda';
import TasksContent from '~/pdf/pages/tasks';
import NotesContent from '~/pdf/pages/notes';
import PdfConfig from '~/pdf/config';
import {
	dayPageLink,
	nextDayPageLink,
	previousDayPageLink,
	monthOverviewLink,
} from '~/pdf/lib/links';
import { content, pageStyle } from '~/pdf/styles';
import { splitItemsByPages } from '~/pdf/utils';

const MONTHS_ES = [
	'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
	'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function formatTitleWithDate( baseTitle, date, lng ) {
	if ( lng === 'es' ) {
		return `${baseTitle} del día ${date.date()} de ${MONTHS_ES[ date.month() ]} ${date.year()}`;
	}
	return `${baseTitle} for ${date.format( 'MMMM D, YYYY' )}`;
}

class DayPage extends React.Component {
	styles = StyleSheet.create(
		Object.assign( {}, { content, page: pageStyle( this.props.config ) } ),
	);

	renderExtraItems = ( items, index ) => (
		<Page key={ index } size={ this.props.config.pageSize } dpi={ this.props.config.dpi }>
			<View style={ this.styles.page }>
				<Itinerary items={ items } />
			</View>
		</Page>
	);

	renderSpecialPage = ( specialType, index ) => {
		const { date, config } = this.props;
		const pageLinks = {
			agenda: dayPageLink( date, config ) + '-agenda',
			tasks: dayPageLink( date, config ) + '-tasks',
			notes: dayPageLink( date, config ) + '-notes',
		};

		const specialDateKey = date.format( SPECIAL_DATES_DATE_FORMAT );
		const specialItems = config.specialDates.filter(
			findByDate( specialDateKey ),
		);

		if ( specialType === ITINERARY_AGENDA ) {
			return (
				<Page
					key={ index }
					id={ dayPageLink( date, config ) + '-agenda' }
					size={ config.pageSize }
					dpi={ config.dpi }
				>
					<View style={ this.styles.page }>
						<Header
							isLeftHanded={ config.isLeftHanded }
							title={ date.format( 'MMMM' ) }
							titleLink={ '#' + monthOverviewLink( date, config ) }
							subtitle={ date.format( 'dddd' ) }
							number={ date.format( 'DD' ) }
							previousLink={ '#' + previousDayPageLink( date, config ) }
							nextLink={ '#' + nextDayPageLink( date, config ) }
							calendar={ <MiniCalendar date={ date } config={ config } /> }
							specialItems={ specialItems }
						/>
						<View style={ this.styles.content }>
							<AgendaContent date={ date } pageLinks={ pageLinks } />
						</View>
					</View>
				</Page>
			);
		}

		const lng = i18next.language || 'es';
		let baseTitle;
		let contentComponent;
		if ( specialType === ITINERARY_TASKS ) {
			baseTitle = i18next.t
				? i18next.t( 'configuration.itinerary.placeholder.tasks' )
				: 'Tasks';
			contentComponent = <TasksContent date={ date } pageLinks={ pageLinks } />;
		} else {
			baseTitle = i18next.t
				? i18next.t( 'configuration.itinerary.placeholder.notes' )
				: 'Notes';
			contentComponent = <NotesContent date={ date } pageLinks={ pageLinks } />;
		}
		const title = formatTitleWithDate( baseTitle, date, lng );

		return (
			<Page
				key={ index }
				id={ dayPageLink( date, config ) + '-' + specialType }
				size={ config.pageSize }
				dpi={ config.dpi }
			>
				<View style={ this.styles.page }>
						<View style={ this.styles.content }>
							{contentComponent}
						</View>
				</View>
			</Page>
		);
	};

	render() {
		const { date, config } = this.props;
		const { items, isEnabled } = config.dayItineraries[ date.weekday() ];
		if ( ! isEnabled ) {
			return null;
		}

		const itemsByPage = splitItemsByPages( items );

		const specialDateKey = this.props.date.format( SPECIAL_DATES_DATE_FORMAT );
		const specialItems = this.props.config.specialDates.filter(
			findByDate( specialDateKey ),
		);

		const firstPageItems = itemsByPage[ 0 ] || [];

		if ( firstPageItems.length === 0 ) {
			return null;
		}

		const hasSpecialFirstPage = firstPageItems.length === 1 &&
			[ ITINERARY_AGENDA, ITINERARY_TASKS, ITINERARY_NOTES ].includes( firstPageItems[ 0 ].type );

		return (
			<>
				{hasSpecialFirstPage ? (
					this.renderSpecialPage( firstPageItems[ 0 ].type, 'first' )
				) : (
					<Page id={ dayPageLink( date, config ) } size={ config.pageSize } dpi={ config.dpi }>
						<View style={ this.styles.page }>
							<Header
								isLeftHanded={ config.isLeftHanded }
								title={ date.format( 'MMMM' ) }
								titleLink={ '#' + monthOverviewLink( date, config ) }
								subtitle={ date.format( 'dddd' ) }
								number={ date.format( 'DD' ) }
								previousLink={ '#' + previousDayPageLink( date, config ) }
								nextLink={ '#' + nextDayPageLink( date, config ) }
								calendar={ <MiniCalendar date={ date } config={ config } /> }
								specialItems={ specialItems }
							/>
							<View style={ this.styles.content }>
								<Itinerary items={ firstPageItems } />
							</View>
						</View>
					</Page>
				)}
				{itemsByPage.slice( 1 ).map( ( pageItems, index ) => {
					if ( pageItems.length === 1 &&
						[ ITINERARY_AGENDA, ITINERARY_TASKS, ITINERARY_NOTES ].includes( pageItems[ 0 ].type ) ) {
						return this.renderSpecialPage( pageItems[ 0 ].type, index + 1 );
					}
					return this.renderExtraItems( pageItems, index + 1 );
				} )}
			</>
		);
	}
}

DayPage.propTypes = {
	config: PropTypes.instanceOf( PdfConfig ).isRequired,
	date: PropTypes.instanceOf( dayjs ).isRequired,
};

export default DayPage;
