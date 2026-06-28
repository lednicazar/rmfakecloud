import { View } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import React from 'react';

class TasksContent extends React.Component {
	render() {
		return <View style={ { flex: 1, flexGrow: 1 } } />;
	}
}

TasksContent.propTypes = {
	date: PropTypes.object.isRequired,
	pageLinks: PropTypes.object.isRequired,
};

export default TasksContent;
