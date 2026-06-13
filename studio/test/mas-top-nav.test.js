import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../src/store.js';
import router from '../src/router.js';
import { PAGE_NAMES, WCS_LANDSCAPE_DRAFT, WCS_LANDSCAPE_PUBLISHED } from '../src/constants.js';
import { delay } from './utils.js';
import '../src/swc.js';
import '../src/mas-top-nav.js';

describe('MasTopNav', () => {
    let sandbox;
    let originalPageValue;
    let originalLandscapeValue;
    let originalSettingsFragmentId;
    let originalSettingsCreating;
    let originalVersionFragmentId;
    let originalPromotionId;
    let originalTranslationProjectId;
    let originalTranslationInEdit;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalPageValue = Store.page.value;
        originalLandscapeValue = Store.landscape.value;
        originalSettingsFragmentId = Store.settings.fragmentId.value;
        originalSettingsCreating = Store.settings.creating.value;
        originalVersionFragmentId = Store.version.fragmentId.value;
        originalPromotionId = Store.promotions.promotionId.value;
        originalTranslationProjectId = Store.translationProjects.translationProjectId.value;
        originalTranslationInEdit = Store.translationProjects.inEdit.value;
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
        Store.page.value = originalPageValue;
        Store.landscape.value = originalLandscapeValue;
        Store.settings.fragmentId.value = originalSettingsFragmentId;
        Store.settings.creating.value = originalSettingsCreating;
        Store.version.fragmentId.value = originalVersionFragmentId;
        Store.promotions.promotionId.value = originalPromotionId;
        Store.translationProjects.translationProjectId.value = originalTranslationProjectId;
        Store.translationProjects.inEdit.value = originalTranslationInEdit;
        delete window.adobeIMS;
    });

    describe('isFragmentEditorPage getter', () => {
        it('should return true when on fragment editor page', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isFragmentEditorPage).to.be.true;
        });

        it('should return false when not on fragment editor page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isFragmentEditorPage).to.be.false;
        });
    });

    describe('isTranslationEditorPage getter', () => {
        it('should return true when on translation editor page', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isTranslationEditorPage).to.be.true;
        });

        it('should return false when not on translation editor page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isTranslationEditorPage).to.be.false;
        });
    });

    describe('isTranslationsPage getter', () => {
        it('should return true when on translations page', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATIONS;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isTranslationsPage).to.be.true;
        });

        it('should return false when not on translations page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isTranslationsPage).to.be.false;
        });
    });

    describe('breadcrumbs', () => {
        it('should render fragment editor breadcrumbs and navigate to content from first crumb', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            const navigateStub = sandbox.stub(router, 'navigateToPage').returns(() => {});
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const items = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')].map((item) =>
                item.textContent.trim(),
            );

            expect(items).to.deep.equal(['Fragments', 'Editor']);
            el.querySelector('.nav-breadcrumbs sp-breadcrumb-item').click();
            expect(navigateStub.calledWith(PAGE_NAMES.CONTENT)).to.be.true;
        });

        it('should render version breadcrumbs and navigate to editor from second crumb', async () => {
            Store.page.value = PAGE_NAMES.VERSION;
            Store.version.fragmentId.value = 'fragment-1';
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor');
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const breadcrumbs = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')];
            const items = breadcrumbs.map((item) => item.textContent.trim());

            expect(items).to.deep.equal(['Fragments', 'Editor', 'Version history']);
            breadcrumbs[1].click();
            expect(navigateSpy.calledWith('fragment-1')).to.be.true;
        });

        it('should not navigate to editor from version breadcrumb when fragmentId is empty', async () => {
            Store.page.value = PAGE_NAMES.VERSION;
            Store.version.fragmentId.value = null;
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor');
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const breadcrumbs = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')];

            breadcrumbs[1].click();
            expect(navigateSpy.called).to.be.false;
        });

        it('should render setting editor breadcrumbs and label for create flow', async () => {
            Store.page.value = PAGE_NAMES.SETTINGS_EDITOR;
            Store.settings.fragmentId.value = null;
            Store.settings.creating.value = true;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const items = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')].map((item) =>
                item.textContent.trim(),
            );
            expect(items).to.deep.equal(['Global settings', 'Create new setting']);
        });

        it('should render setting editor breadcrumbs and label for edit flow', async () => {
            Store.page.value = PAGE_NAMES.SETTINGS_EDITOR;
            Store.settings.fragmentId.set('setting-1');
            Store.settings.creating.set(false);
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const items = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')].map((item) =>
                item.textContent.trim(),
            );
            expect(items).to.deep.equal(['Global settings', 'Edit setting']);
        });

        it('should not render settings breadcrumbs when no setting id and not creating', async () => {
            Store.page.value = PAGE_NAMES.SETTINGS_EDITOR;
            Store.settings.fragmentId.value = null;
            Store.settings.creating.value = false;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const breadcrumbs = el.querySelector('.nav-breadcrumbs');
            expect(breadcrumbs).to.not.exist;
        });
    });

    describe('header background', () => {
        it('should have a black background', async () => {
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.headerBackground).to.equal('#000');
        });

        it('should render the top-nav element with a black background-color style', async () => {
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const nav = el.querySelector('.top-nav');
            expect(nav).to.exist;
            expect(nav.style.backgroundColor).to.equal('#000');
        });
    });
});
