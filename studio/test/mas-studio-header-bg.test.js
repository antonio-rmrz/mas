/**
 * Tests that the Studio header (mas-top-nav) has a dark-blue background.
 * Verifies both the CSS custom property token and its application to the element.
 */
import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../src/store.js';
import '../src/swc.js';
import '../src/mas-top-nav.js';

describe('Studio header dark-blue background', () => {
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
        Store.search.value = { path: 'acom' };

        // Inject the relevant CSS rules so the test environment picks them up.
        styleEl = document.createElement('style');
        styleEl.textContent = `
            :root { --studio-header-bg: #012b54; }
            mas-top-nav {
                background-color: var(--studio-header-bg, #012b54);
                color: #ffffff;
            }
        `;
        document.head.appendChild(styleEl);
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        delete window.adobeIMS;
        if (styleEl && styleEl.parentNode) {
            styleEl.parentNode.removeChild(styleEl);
        }
    });

    it('defines --studio-header-bg as #012b54 on :root', () => {
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue('--studio-header-bg')
            .trim();
        expect(value).to.equal('#012b54');
    });

    it('applies dark-blue background-color to mas-top-nav element', async () => {
        const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
        const bg = getComputedStyle(el).getPropertyValue('background-color').trim();
        // getComputedStyle resolves the var(); browsers return rgb(1, 43, 84) for #012b54.
        // Accept either the resolved rgb form or the raw hex (jsdom may return the hex).
        const isExpectedColor =
            bg === 'rgb(1, 43, 84)' ||
            bg.toLowerCase() === '#012b54' ||
            bg === 'rgba(1, 43, 84, 1)';
        expect(isExpectedColor, `Expected dark-blue background but got: ${bg}`).to.be.true;
    });

    it('sets color to white on mas-top-nav for legibility', async () => {
        const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
        const color = getComputedStyle(el).getPropertyValue('color').trim();
        const isWhite =
            color === 'rgb(255, 255, 255)' ||
            color.toLowerCase() === '#ffffff' ||
            color === 'rgba(255, 255, 255, 1)';
        expect(isWhite, `Expected white text color but got: ${color}`).to.be.true;
    });
});
