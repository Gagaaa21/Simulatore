import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Build "artifact": un unico file HTML autosufficiente. React viene caricato
 * dalla CDN (UMD) e questi moduli virtuali lo leggono dalle variabili globali,
 * così la libreria non viene incorporata nel bundle.
 */
function reactFromGlobals(): Plugin {
  const shims: Record<string, string> = {
    react: `const R = window.React; export default R;
export const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext,
  createContext, Fragment, memo, useLayoutEffect, useSyncExternalStore, forwardRef,
  Children, cloneElement, createElement, StrictMode, useId, isValidElement } = R;`,
    'react/jsx-runtime': `const R = window.React;
function jsx(type, props, key) { const p = Object.assign({}, props); if (key !== undefined) p.key = key; const c = p.children; delete p.children; return c === undefined ? R.createElement(type, p) : R.createElement(type, p, c); }
function jsxs(type, props, key) { const p = Object.assign({}, props); if (key !== undefined) p.key = key; const c = p.children; delete p.children; return R.createElement(type, p, ...(Array.isArray(c) ? c : [c])); }
export { jsx, jsxs }; export const Fragment = R.Fragment;`,
    'react-dom/client': `const D = window.ReactDOM; export default D; export const { createRoot, hydrateRoot } = D;`,
    'react-dom': `const D = window.ReactDOM; export default D; export const { createPortal, flushSync } = D;`,
  };
  return {
    name: 'react-from-globals',
    enforce: 'pre',
    resolveId(id) {
      if (id in shims) return '\0shim:' + id;
      return null;
    },
    load(id) {
      if (id.startsWith('\0shim:')) return shims[id.slice(6)];
      return null;
    },
  };
}

export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact';
  return {
    base: './',
    plugins: artifact ? [reactFromGlobals(), viteSingleFile()] : [react()],
    build: {
      outDir: artifact ? 'dist-artifact' : 'dist',
      emptyOutDir: true,
      target: 'es2020',
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.test.ts'],
    },
  };
});
