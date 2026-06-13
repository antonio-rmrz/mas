import { ENVS, EnvColorCode, WCS_LANDSCAPE_DRAFT, WCS_LANDSCAPE_PUBLISHED, PAGE_NAMES } from './constants.js';
import { LitElement, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { until } from 'lit/directives/until.js';
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import router from './router.js';
import { extractLocaleFromPath } from './utils.js';
import { getDefaultLocaleCode } from '../../io/www/src/fragment/locales.js';
import './mas-nav-folder-picker.js';
import './mas-locale-picker.js';

class MasTopNav extends LitElement {
    page = Store.page;
    inEdit = Store.fragments.inEdit;
    editorContext = Store.fragmentEditor.editorContext;
    search = Store.search;
    filters = Store.filters;
    landscape = Store.landscape;
    settings = Store.settings;
    version = Store.version;
    promotions = Store.promotions;
    translationProjects = Store.translationProjects;
    bulkPublishProjects = Store.bulkPublishProjects;

    reactiveController = new ReactiveController(this, [
        this.page,
        this.inEdit,
        this.editorContext,
        this.search,
        this.filters,
        this.landscape,
        this.settings.fragmentId,
        this.settings.creating,
        this.version.fragmentId,
        this.promotions.promotionId,
        this.translationProjects.translationProjectId,
        this.translationProjects.inEdit,
        this.bulkPublishProjects.inEdit,
        this.bulkPublishProjects.projectId,
    ]);

    createRenderRoot() {
        return this;
    }
    async profileBuilder() {
        try {
            const accessToken = window.adobeIMS.getAccessToken();
            const ioResp = await fetch(`https://${ENVS[this.aemEnv].adobeIO}/profile`, {
                headers: new Headers({
                    Authorization: `Bearer ${accessToken.token}`,
                }),
            });
            const profiles = {};
            profiles.ims = await window.adobeIMS.getProfile();
            profiles.io = await ioResp.json();
            const { displayName, email } = profiles.ims;
            const { user } = profiles.io;
            const { avatar } = user;
            const profileEl = document.createElement('div');
            profileEl.classList.add('profile');
            profileEl.innerHTML = `
            <button class="profile-button">
                    <img src="${avatar}" alt="${displayName}" height="26">
                </button>
                <div class="profile-body">
                    <div class="account-menu-header">
                        <div class="avatar-container"><img src="${avatar}" alt="${displayName}" class="avatar-image"></div>
                        <div class="account-info">
                            <h2>${displayName}</h2>
                            <p>${email}</p>
                            <a href="https://account.adobe.com" target="_blank">Manage account</a>
                        </div>
                    </div>
                    <div class="account-menu">
                        <hr>
                        <a class="signout-link">
                            <div class="account-menu-item">Sign out</div>
                        </a>
                    </div>
                </div>
            `;
            const profileButton = profileEl.querySelector('.profile-button');
            const profileBody = profileEl.querySelector('.profile-body');
            const signOutLink = profileEl.querySelector('.signout-link');
            const studioContentEl = document.querySelector('.studio-content');

            profileButton.addEventListener('click', () => {
                profileBody.classList.toggle('show');
            });
            signOutLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.adobeIMS.signOut();
            });
            studioContentEl?.addEventListener('click', () => {
                profileBody.classList.remove('show');
            });

            return profileEl;
        } catch (error) {
            console.error('Failed to build profile:', error);
            const fallbackEl = document.createElement('div');
            fallbackEl.classList.add('profile-error');
            fallbackEl.innerHTML = '<div>Profile unavailable</div>';
            return fallbackEl;
        }
    }

    static properties = {
        aemEnv: { type: String, attribute: 'aem-env' },
        showPickers: { type: Boolean, attribute: 'show-pickers' },
    };

    profileTemplatePromise = null;

    constructor() {
        super();
        this.aemEnv = 'prod';
        this.showPickers = true;
        this.search.subscribe(() => {
            this.requestUpdate();
        });
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('aemEnv')) {
            this.profileTemplatePromise = null;
        }
    }

    getProfileTemplate() {
        if (!this.profileTemplatePromise) {
            this.profileTemplatePromise = this.profileBuilder().then((profile) => html`${profile}`);
        }
        return this.profileTemplatePromise;
    }

    get shouldShowPickers() {
        return this.showPickers;
    }

    get isContentPage() {
        return this.page.value === PAGE_NAMES.CONTENT;
    }

    get isPlaceholdersPage() {
        return this.page.value === PAGE_NAMES.PLACEHOLDERS;
    }

    get isSettingsPage() {
        return this.page.value === PAGE_NAMES.SETTINGS || this.page.value === PAGE_NAMES.SETTINGS_EDITOR;
    }

    get isWelcomePage() {
        return this.page.value === PAGE_NAMES.WELCOME;
    }

    get isFragmentEditorPage() {
        return this.page.value === PAGE_NAMES.FRAGMENT_EDITOR;
    }

    get isTranslationEditorPage() {
        return this.page.value === PAGE_NAMES.TRANSLATION_EDITOR;
    }

    get isTranslationsPage() {
        return this.page.value === PAGE_NAMES.TRANSLATIONS;
    }

    get isSettingsEditorPage() {
        return this.page.value === PAGE_NAMES.SETTINGS_EDITOR;
    }

    get isBulkPublishEditorPage() {
        return this.page.value === PAGE_NAMES.BULK_PUBLISH_EDITOR;
    }

    get topNavLocale() {
        if (this.isFragmentEditorPage) {
            const fragmentId = this.inEdit.get()?.get()?.id;
            if (this.editorContext.isGroupedVariationByPath) {
                return Store.localeOrRegion();
            }
            if (this.editorContext.isVariation(fragmentId) && this.editorContext.localeDefaultFragment?.path) {
                return extractLocaleFromPath(this.editorContext.localeDefaultFragment.path);
            }
        }
        const locale = Store.localeOrRegion();
        return getDefaultLocaleCode(Store.surface(), locale) || locale;
    }

    get isLocalePickerDisabled() {
        if (this.isWelcomePage || this.isContentPage || this.isPlaceholdersPage) {
            return false;
        }
        if (this.isFragmentEditorPage) {
            // Enable picker when viewing default locale fragment (not a variation)
            // so users can browse to locale variations
            const fragmentId = this.inEdit.get()?.get()?.id;
            if (this.editorContext.isGroupedVariationByPath) return false;
            return this.editorContext.isVariation(fragmentId);
        }
        return true;
    }

    get isDraftLandscape() {
        return this.landscape.value === WCS_LANDSCAPE_DRAFT;
    }

    async onLocaleChanged(e) {
        const { locale, fragmentId } = e.detail;
        if (this.isFragmentEditorPage) {
            const currentFragment = this.inEdit.get()?.get();
            if (fragmentId && fragmentId !== currentFragment?.id) {
                if (currentFragment?.hasChanges) {
                    const editor = document.querySelector('mas-fragment-editor');
                    const confirmed = await editor?.promptDiscardChanges();
                    if (!confirmed) {
                        // Reset the picker to the current locale
                        e.target.value = this.topNavLocale;
                        return;
                    }
                }
                router.navigateToFragmentEditor(fragmentId);
                return;
            }
        }
        Store.filters.set({ ...Store.filters.value, locale });
    }

    get headerBackground() {
        return '#000';
    }

    get envColorCode() {
        return EnvColorCode[this.aemEnv] ?? '';
    }

    get breadcrumbs() {
        if (this.isFragmentEditorPage) {
            return html`<sp-breadcrumbs class="nav-breadcrumbs">
                <sp-breadcrumb-item @click=${() => router.navigateToPage(PAGE_NAMES.CONTENT)}>Fragments</sp-breadcrumb-item>
                <sp-breadcrumb-item>Editor</sp-breadcrumb-item>
            </sp-breadcrumbs>`;
        }
        if (this.page.value === PAGE_NAMES.VERSION) {
            const fragmentId = this.version.fragmentId.value;
            return html`<sp-breadcrumbs class="nav-breadcrumbs">
                <sp-breadcrumb-item @click=${() => router.navigateToPage(PAGE_NAMES.CONTENT)}>Fragments</sp-breadcrumb-item>
                <sp-breadcrumb-item @click=${() => fragmentId && router.navigateToFragmentEditor(fragmentId)}>Editor</sp-breadcrumb-item>
                <sp-breadcrumb-item>Version history</sp-breadcrumb-item>
            </sp-breadcrumbs>`;
        }
        if (this.isSettingsEditorPage) {
            const fragmentId = this.settings.fragmentId.value;
            const creating = this.settings.creating.value;
            if (!fragmentId && !creating) return nothing;
            const label = creating ? 'Create new setting' : 'Edit setting';
            return html`<sp-breadcrumbs class="nav-breadcrumbs">
                <sp-breadcrumb-item @click=${() => router.navigateToPage(PAGE_NAMES.SETTINGS)}>Global settings</sp-breadcrumb-item>
                <sp-breadcrumb-item>${label}</sp-breadcrumb-item>
            </sp-breadcrumbs>`;
        }
        if (this.isBulkPublishEditorPage) {
            const projectId = this.bulkPublishProjects.projectId.value;
            const inEdit = this.bulkPublishProjects.inEdit.value;
            if (!projectId && !inEdit) return nothing;
            const label = inEdit ? 'Edit project' : 'View project';
            return html`<sp-breadcrumbs class="nav-breadcrumbs">
                <sp-breadcrumb-item @click=${() => router.navigateToPage(PAGE_NAMES.BULK_PUBLISH)}>Bulk publish</sp-breadcrumb-item>
                <sp-breadcrumb-item>${label}</sp-breadcrumb-item>
            </sp-breadcrumbs>`;
        }
        if (this.isTranslationEditorPage) {
            const projectId = this.translationProjects.translationProjectId.value;
            const inEdit = this.translationProjects.inEdit.value;
            if (!projectId && !inEdit) return nothing;
            const label = inEdit ? 'Edit project' : 'View project';
            return html`<sp-breadcrumbs class="nav-breadcrumbs">
                <sp-breadcrumb-item @click=${() => router.navigateToPage(PAGE_NAMES.TRANSLATIONS)}>Translations</sp-breadcrumb-item>
                <sp-breadcrumb-item>${label}</sp-breadcrumb-item>
            </sp-breadcrumbs>`;
        }
        return nothing;
    }

    get pickers() {
        if (!this.shouldShowPickers) return nothing;
        return html`
            <mas-locale-picker
                .locale=${this.topNavLocale}
                ?disabled=${this.isLocalePickerDisabled}
                @locale-changed=${this.onLocaleChanged}
            ></mas-locale-picker>
            <mas-nav-folder-picker></mas-nav-folder-picker>
        `;
    }

    get landscapeToggle() {
        if (!this.isContentPage && !this.isFragmentEditorPage) return nothing;
        return html`
            <sp-action-group>
                <sp-action-button
                    class="landscape-toggle"
                    ?selected=${!this.isDraftLandscape}
                    @click=${() => (Store.landscape.value = WCS_LANDSCAPE_PUBLISHED)}
                    >Published</sp-action-button
                >
                <sp-action-button
                    class="landscape-toggle"
                    ?selected=${this.isDraftLandscape}
                    @click=${() => (Store.landscape.value = WCS_LANDSCAPE_DRAFT)}
                    >Draft</sp-action-button
                >
            </sp-action-group>
        `;
    }

    render() {
        return html`
            <nav class="top-nav" style="background-color: ${this.headerBackground};">
                <div class="nav-logo">
                    <img src="/img/adobe-logo.svg" alt="Adobe" />
                    <span class="nav-title">MAS Studio</span>
                    ${this.envColorCode ? html`<span class="env-badge" style="background:${this.envColorCode}">${this.aemEnv}</span>` : nothing}
                </div>
                ${this.breadcrumbs}
                <div class="nav-actions">
                    ${this.pickers}
                    ${this.landscapeToggle}
                    ${until(this.getProfileTemplate(), nothing)}
                </div>
            </nav>
        `;
    }
}

customElements.define('mas-top-nav', MasTopNav);
