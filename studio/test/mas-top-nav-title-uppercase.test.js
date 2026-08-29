import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../src/store.js';
import '../src/swc.js';
import '../src/mas-top-nav.js';

describe('MasTopNav – Studio header uppercase', () => {
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

    it('applies text-transform: uppercase to the .nav-title element', async () => {
        const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
        const navTitle = el.querySelector('.nav-title');
        expect(navTitle, '.nav-title element should exist').to.exist;
        const inlineStyle = navTitle.getAttribute('style') || '';
        const computedTransform = getComputedStyle(navTitle).textTransform;
        const hasUppercase =
            inlineStyle.includes('text-transform') ||
            computedTransform === 'uppercase';
        expect(hasUppercase, 'nav-title should have text-transform: uppercase').to.be.true;
    });
});
