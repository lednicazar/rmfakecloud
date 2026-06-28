import { View } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import React from 'react';

class NotesContent extends React.Component {
	render() {
		return <View style={ { flex: 1, flexGrow: 1 } } />;
	}
}

NotesContent.propTypes = {
	date: PropTypes.object.isRequired,
	pageLinks: PropTypes.object.isRequired,
};

export default NotesContent;
