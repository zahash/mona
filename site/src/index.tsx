/* @refresh reload */
import { lazy } from 'solid-js';
import { render } from 'solid-js/web';
import { Route, HashRouter } from '@solidjs/router';
import { MetaProvider } from '@solidjs/meta';

import './index.css';
import Home from './pages/Home';
const JsonCodeGen = lazy(() => import('./pages/JsonCodeGen'));
const LeetCodeTracker = lazy(() => import('./pages/LeetCodeTracker'));

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => (
  <MetaProvider>
    <HashRouter>
      <Route path="/" component={Home} />
      <Route path="/jsoncodegen" component={JsonCodeGen} />
      <Route path="/leetcode-tracker" component={LeetCodeTracker} />
    </HashRouter>
  </MetaProvider>
), root!);
