// Polyfill: Vite's @react-refresh module (injected by @vitejs/plugin-react-swc)
// accesses window.__registerBeforePerformReactRefresh at module level (line 603).
// In a Web Worker, window is undefined. This shim aliases window→self BEFORE
// any JSX modules load, preventing the ReferenceError.
if (typeof window === 'undefined') {
	self.window = self;
}
