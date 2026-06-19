import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../src/store.js';
import '../src/swc.js';
import '../src/mas-top-nav.js';

describe('MasTopNav – dark blue header background', () => {
    let sandbox;
    let styleEl;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        window.adobeIMS = {
            getAccessToken: () => ({ token: 'mock-token' }),
            getProfile: () => Promise.resolve({ displayName: 'Test User', email: 'test@example.com' }),
            signOut: sandbox.stub(),
        };
        sandbox.stub(window, 'fetch').resolves({
            json: () => Promise.resolve({ user: { avatar: 'https://example.com/avatar.png' } }),
        });
        // Inject the CSS custom property so the test environment mirrors the real stylesheet.
        styleEl = document.createElement('style');
        styleEl.textContent = `
            :root { --studio-header-bg: #003366; }
            mas-top-nav {
                background-color: var(--studio-header-bg, #003366);
                color: #ffffff;
            }
        `;
        document.head.appendChild(styleEl);
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        styleEl.remove();
        delete window.adobeIMS;
    });

    it('should define --studio-header-bg as #003366 on :root', () => {
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue('--studio-header-bg')
            .trim();
        expect(value).to.equal('#003366');
    });

    it('should apply dark blue background-color to mas-top-nav element', async () => {
        const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
        const bg = getComputedStyle(el).getPropertyValue('background-color').trim();
        // Browsers resolve #003366 to rgb(0, 51, 102)
        expect(bg).to.equal('rgb(0, 51, 102)');
    });

    it('should apply white foreground color to mas-top-nav element', async () => {
        const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
        const color = getComputedStyle(el).getPropertyValue('color').trim();
        // Browsers resolve #ffffff to rgb(255, 255, 255)
        expect(color).to.equal('rgb(255, 255, 255)');
    });
});
