/**
 * Tests that the Studio header (mas-top-nav) has a dark blue background.
 * Verifies the CSS custom property --mas-header-bg is defined and that
 * mas-top-nav's computed background-color resolves to the expected dark blue.
 */
import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../src/store.js';
import '../src/swc.js';
import '../src/mas-top-nav.js';

/** Expected dark-blue hex value (lower-cased, no spaces). */
const DARK_BLUE_HEX = '#00215e';

/**
 * Convert an rgb(r, g, b) string returned by getComputedStyle to a hex string
 * so we can compare it against the source value regardless of browser
 * normalisation.
 */
function rgbToHex(rgb) {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return rgb.toLowerCase().trim();
    return (
        '#' +
        [match[1], match[2], match[3]]
            .map((n) => parseInt(n, 10).toString(16).padStart(2, '0'))
            .join('')
    );
}

describe('Studio header dark-blue background', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        window.adobeIMS = {
            getAccessToken: () => ({ token: 'mock-token' }),
            getProfile: () =>
                Promise.resolve({
                    displayName: 'Test User',
                    email: 'test@example.com',
                }),
            signOut: sandbox.stub(),
        };
        sandbox.stub(window, 'fetch').resolves({
            json: () =>
                Promise.resolve({
                    user: { avatar: 'https://example.com/avatar.png' },
                }),
        });
        Store.search.value = { path: 'acom' };
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        delete window.adobeIMS;
    });

    it('defines the --mas-header-bg CSS variable on :root', () => {
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue('--mas-header-bg')
            .trim()
            .toLowerCase();
        expect(value).to.equal(DARK_BLUE_HEX);
    });

    it('defines the --mas-header-color CSS variable on :root as white', () => {
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue('--mas-header-color')
            .trim()
            .toLowerCase();
        expect(value).to.equal('#ffffff');
    });

    it('renders mas-top-nav with a dark blue background-color', async () => {
        // Inject the stylesheet so computed styles are available in the test
        // environment (if not already present).
        if (!document.querySelector('link[href*="style.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/style.css';
            document.head.appendChild(link);
            // Give the browser a tick to parse the sheet.
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
        const bg = getComputedStyle(el).backgroundColor;
        // bg may be 'rgb(0, 33, 94)' or already hex depending on the engine.
        const hex = rgbToHex(bg);
        expect(hex).to.equal(DARK_BLUE_HEX);
    });
});
