import { View } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import React from 'react';

class AgendaContent extends React.Component {
	render() {
		return <View style={ { flex: 1, flexGrow: 1 } } />;
	}
}

AgendaContent.propTypes = {
	date: PropTypes.object,
	pageLinks: PropTypes.object.isRequired,
};

export default AgendaContent;
