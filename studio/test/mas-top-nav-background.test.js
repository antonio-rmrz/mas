import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../src/store.js';
import '../src/swc.js';
import '../src/mas-top-nav.js';

describe('MasTopNav background color', () => {
    let sandbox;

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
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        delete window.adobeIMS;
    });

    it('should have a black background color', async () => {
        const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
        // The background is set as an inline style in connectedCallback
        expect(el.style.backgroundColor).to.equal('#000');
    });

    it('background color should resolve to rgb(0, 0, 0)', async () => {
        const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
        const computed = getComputedStyle(el).backgroundColor;
        // rgb(0, 0, 0) is the computed form of #000 / black
        expect(computed).to.equal('rgb(0, 0, 0)');
    });
});
