import { Window } from 'happy-dom';

const window = new Window();
global.window = window as any;
global.document = window.document as any;
global.navigator = window.navigator as any;

// Optional: cleanup after each test to keep things isolated
import { afterEach } from 'bun:test';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
