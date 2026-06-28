/**
 * Shared layout constants for the hybrid PDF system.
 * These values MUST match layout.json (shared with ephemeris Python).
 * 
 * Page: reMarkable at 226 DPI = 447.292 × 596.389 pt
 */

export const PAGE_WIDTH = 447.292;
export const PAGE_HEIGHT = 596.389;

// Space reserved for reMarkable toolbar at top
export const RM_TOOLBAR_HEIGHT = 40;

// Navigation buttons configuration
export const NAV_BUTTON_WIDTH = 50;
export const NAV_BUTTON_HEIGHT = 16;
export const NAV_BUTTON_SPACING = 6;
export const NAV_MARGIN_LEFT = 20;
export const NAV_Y = 487;

// Content area bounds (where ephemeris will overlay)
export const CONTENT = {
	agenda: {
		top: 455,
		bottom: 30,
		left: 32,
		right: 441.292,
	},
	tasks: {
		// top is computed dynamically: nav_bottom - top_offset
		topOffsetFromNav: 22,
		bottom: 30,
		left: 20,
		right: 427.292,
		rowHeight: 22,
		checkboxSize: 9,
	},
	notes: {
		topOffsetFromNav: 25,
		bottom: 30,
		left: 20,
		right: 427.292,
		lineHeight: 20,
	},
};

// Time grid configuration
export const GRID = {
	startHour: 6,
	endHour: 24,
	timeLabelWidth: 26,
	hourHeight: 23.616,
};
