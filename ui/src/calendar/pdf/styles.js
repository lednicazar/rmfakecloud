export function pageStyle( { alwaysOnSidebar, isLeftHanded, topMargin } ) {
	return {
		flex: 1,
		width: '100%',
		height: '100%',
		flexGrow: 1,
		flexDirection: 'column',
		paddingLeft: alwaysOnSidebar && ! isLeftHanded ? 31 : 0,
		paddingRight: alwaysOnSidebar && isLeftHanded ? 31 : 0,
		paddingTop: topMargin ? 36 : 0,
	};
}

export const content = {
	flex: 1,
	flexGrow: 1,
	borderTop: '1 solid black',
};
