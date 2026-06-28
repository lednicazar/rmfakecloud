import { View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import React from 'react';

const BUTTON_WIDTH = 50;
const BUTTON_HEIGHT = 14;
const BUTTON_SPACING = 6;

const BUTTONS = [
	{ key: 'agenda', label: 'Agenda' },
	{ key: 'tasks', label: 'Tareas' },
	{ key: 'notes', label: 'Notas' },
];

class NavigationButtons extends React.PureComponent {
	constructor( props ) {
		super( props );
		this.styles = StyleSheet.create( {
			wrapper: {
				width: '100%',
			},
			row: {
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignItems: 'center',
			},
			buttonsContainer: {
				flexDirection: 'row',
			},
			title: {
				fontSize: 11,
				fontWeight: 'bold',
				color: '#333333',
				textAlign: 'right',
				flex: 1,
				marginLeft: 10,
			},
			separator: {
				borderBottomWidth: 0.5,
				borderBottomColor: '#CCCCCC',
				marginTop: 4,
				marginBottom: 6,
			},
			activeButton: {
				width: BUTTON_WIDTH,
				height: BUTTON_HEIGHT,
				backgroundColor: '#555555',
				justifyContent: 'center',
				alignItems: 'center',
				marginRight: BUTTON_SPACING,
				borderRadius: 3,
			},
			inactiveButton: {
				width: BUTTON_WIDTH,
				height: BUTTON_HEIGHT,
				backgroundColor: '#DDDDDD',
				justifyContent: 'center',
				alignItems: 'center',
				marginRight: BUTTON_SPACING,
				borderRadius: 3,
			},
			activeText: {
				fontSize: 8,
				fontWeight: 'bold',
				color: '#FFFFFF',
				textAlign: 'center',
			},
			inactiveText: {
				fontSize: 8,
				fontWeight: 'bold',
				color: '#888888',
				textAlign: 'center',
			},
		} );
	}

	render() {
		const { currentPage, pageLinks, title } = this.props;

		return (
			<View style={ this.styles.wrapper }>
				<View style={ this.styles.row }>
					<View style={ this.styles.buttonsContainer }>
						{BUTTONS.map( ( btn ) => {
							const isActive = btn.key !== currentPage;
							const linkTarget = isActive ? pageLinks[ btn.key ] : null;

							const buttonStyle = isActive
								? this.styles.activeButton
								: this.styles.inactiveButton;
							const textStyle = isActive
								? this.styles.activeText
								: this.styles.inactiveText;

							if ( isActive && linkTarget ) {
								return (
									<Link key={ btn.key } src={ '#' + linkTarget } style={ buttonStyle }>
										<Text style={ textStyle }>{btn.label}</Text>
									</Link>
								);
							}

							return (
								<View key={ btn.key } style={ buttonStyle }>
									<Text style={ textStyle }>{btn.label}</Text>
								</View>
							);
						} ) }
					</View>
					{title && (
						<Text style={ this.styles.title }>{title}</Text>
					) }
				</View>
				{title && (
					<View style={ this.styles.separator} />
				) }
			</View>
		);
	}
}

NavigationButtons.propTypes = {
	currentPage: PropTypes.oneOf( [ 'agenda', 'tasks', 'notes' ] ).isRequired,
	pageLinks: PropTypes.shape( {
		agenda: PropTypes.string,
		tasks: PropTypes.string,
		notes: PropTypes.string,
	} ).isRequired,
	title: PropTypes.string,
};

export default NavigationButtons;
