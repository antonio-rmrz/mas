import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Promotion } from '../../src/aem/promotion.js';
import { PAGE_NAMES } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/promotions/mas-promotions.js';

function makePromotion(overrides = {}) {
    const data = {
        id: overrides.id ?? `promo-${Math.random().toString(36).slice(2)}`,
        title: overrides.title ?? 'Test Promo',
        path: overrides.path ?? '/content/dam/mas/promotions/test',
        fields: overrides.fields ?? [
            { name: 'title', type: 'text', values: [overrides.title ?? 'Test Promo'] },
            { name: 'startDate', values: ['2025-01-01'] },
            { name: 'endDate', values: ['2025-12-31'] },
            { name: 'surfaces', type: 'text', multiple: true, values: overrides.surfaces ?? [] },
            { name: 'tags', values: [] },
        ],
        tags: [],
        etag: '"etag"',
        status: 'DRAFT',
        created: { fullName: 'Test User' },
    };
    const store = new FragmentStore(new Promotion(data));
    return store;
}

function makeRepo(sandbox) {
    return {
        loadPromotions: sandbox.stub().resolves(),
        getPromotionsPath: sandbox.stub().returns('/content/dam/mas/promotions'),
    };
}

async function renderPromotions(sandbox, promotions = []) {
    Store.promotions.list.data.set(promotions);
    Store.promotions.list.loading.set(false);
    Store.promotions.list.filter.set('all');
    Store.promotions.list.filterOptions.set([{ value: 'all', label: 'All' }]);
    Store.page.set(PAGE_NAMES.PROMOTIONS);

    const MasPromotions = customElements.get('mas-promotions');
    const el = new MasPromotions();
    const repo = makeRepo(sandbox);
    sandbox.stub(el, 'repository').get(() => repo);
    // Override loadPromotions so connectedCallback does not flip loading state
    el.loadPromotions = async () => {
        el.promotionsData = Store.promotions.list.data.get() || [];
        el.promotionsLoading = false;
    };
    document.body.appendChild(el);
    await el.updateComplete;
    // Wait for async connectedCallback to finish
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
    return el;
}

function $(el, selector) {
    return el.shadowRoot.querySelector(selector);
}

function $$(el, selector) {
    return [...el.shadowRoot.querySelectorAll(selector)];
}

describe('MasPromotions', () => {
    let sandbox;
    let originalData;
    let originalFilter;
    let originalFilterOptions;
    let originalLoading;
    let originalPage;
    let originalFilters;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalData = Store.promotions.list.data.get();
        originalFilter = Store.promotions.list.filter.get();
        originalFilterOptions = Store.promotions.list.filterOptions.get();
        originalLoading = Store.promotions.list.loading.get();
        originalPage = Store.page.get();
        originalFilters = Store.filters.get();
    });

    afterEach(async () => {
        document.querySelectorAll('mas-promotions').forEach((el) => el.remove());
        await new Promise((r) => setTimeout(r, 0));
        sandbox.restore();
        Store.promotions.list.data.set(originalData);
        Store.promotions.list.filter.set(originalFilter);
        Store.promotions.list.filterOptions.set(originalFilterOptions);
        Store.promotions.list.loading.set(originalLoading);
        Store.page.set(originalPage);
        Store.filters.set(originalFilters);
    });

    describe('surfaces column', () => {
        it('renders a Surfaces column header', async () => {
            const el = await renderPromotions(sandbox, [makePromotion()]);

            const headerCells = $$(el, 'sp-table-head-cell');
            const labels = headerCells.map((c) => c.textContent.trim());
            expect(labels).to.include('Surfaces');
        });

        it('renders surface labels for a promotion with surfaces', async () => {
            const promo = makePromotion({ title: 'Promo With Surfaces', surfaces: ['acom', 'ccd'] });
            const el = await renderPromotions(sandbox, [promo]);

            const rows = $$(el, 'sp-table-row');
            expect(rows).to.have.length(1);
            const cells = [...rows[0].querySelectorAll('sp-table-cell')];
            const surfaceCell = cells.find((c) => c.textContent.includes('Adobe.com') || c.textContent.includes('CCD'));
            expect(surfaceCell).to.not.be.undefined;
            expect(surfaceCell.textContent).to.include('Adobe.com');
            expect(surfaceCell.textContent).to.include('CCD');
        });

        it('renders an empty surfaces cell for a promotion with no surfaces', async () => {
            const promo = makePromotion({ title: 'No Surfaces Promo', surfaces: [] });
            const el = await renderPromotions(sandbox, [promo]);

            const rows = $$(el, 'sp-table-row');
            expect(rows).to.have.length(1);
            // surfaces column is at index 4: title(0), timeline(1), status(2), owner(3), surfaces(4), actions(5)
            const cells = [...rows[0].querySelectorAll('sp-table-cell')];
            expect(cells[4].textContent.trim()).to.equal('');
        });
    });

    describe('surface filter', () => {
        it('renders a Surface filter control in the filters area', async () => {
            const el = await renderPromotions(sandbox, [makePromotion()]);

            const filterContainer = $(el, '.filters-container');
            expect(filterContainer).to.not.be.null;
            const trigger = filterContainer.querySelector('sp-action-button');
            expect(trigger).to.not.be.null;
            expect(trigger.textContent).to.include('Surface');
        });

        it('shows all promotions when no surface filter is selected', async () => {
            const promos = [
                makePromotion({ title: 'Promo A', surfaces: ['acom'] }),
                makePromotion({ title: 'Promo B', surfaces: ['ccd'] }),
            ];
            const el = await renderPromotions(sandbox, promos);

            const rows = $$(el, 'sp-table-row');
            expect(rows).to.have.length(2);
        });

        it('filters promotions to only those matching the selected surface', async () => {
            const promos = [
                makePromotion({ title: 'Promo A', surfaces: ['acom'] }),
                makePromotion({ title: 'Promo B', surfaces: ['ccd'] }),
                makePromotion({ title: 'Promo C', surfaces: ['acom', 'ccd'] }),
            ];
            const el = await renderPromotions(sandbox, promos);

            el.surfaceFilter = ['acom'];
            await el.updateComplete;

            const rows = $$(el, 'sp-table-row');
            expect(rows).to.have.length(2);
            const titles = rows.map((r) => r.querySelector('sp-table-cell').textContent.trim());
            expect(titles).to.include('Promo A');
            expect(titles).to.include('Promo C');
            expect(titles).to.not.include('Promo B');
        });

        it('supports filtering by multiple surfaces simultaneously', async () => {
            const promos = [
                makePromotion({ title: 'Promo A', surfaces: ['acom'] }),
                makePromotion({ title: 'Promo B', surfaces: ['ccd'] }),
                makePromotion({ title: 'Promo C', surfaces: ['express'] }),
            ];
            const el = await renderPromotions(sandbox, promos);

            el.surfaceFilter = ['acom', 'ccd'];
            await el.updateComplete;

            const rows = $$(el, 'sp-table-row');
            expect(rows).to.have.length(2);
            const titles = rows.map((r) => r.querySelector('sp-table-cell').textContent.trim());
            expect(titles).to.include('Promo A');
            expect(titles).to.include('Promo B');
            expect(titles).to.not.include('Promo C');
        });

        it('restores all promotions when surface filter is cleared', async () => {
            const promos = [
                makePromotion({ title: 'Promo A', surfaces: ['acom'] }),
                makePromotion({ title: 'Promo B', surfaces: ['ccd'] }),
            ];
            const el = await renderPromotions(sandbox, promos);

            el.surfaceFilter = ['acom'];
            await el.updateComplete;
            expect($$(el, 'sp-table-row')).to.have.length(1);

            el.surfaceFilter = [];
            await el.updateComplete;
            expect($$(el, 'sp-table-row')).to.have.length(2);
        });

        it('shows no promotions when selected surface matches none', async () => {
            const promos = [makePromotion({ title: 'Promo A', surfaces: ['ccd'] })];
            const el = await renderPromotions(sandbox, promos);

            el.surfaceFilter = ['express'];
            await el.updateComplete;

            const rows = $$(el, 'sp-table-row');
            expect(rows).to.have.length(0);
        });
    });
});
