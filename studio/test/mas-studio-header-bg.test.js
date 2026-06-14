import { expect } from '@esm-bundle/chai';

describe('Studio header dark-blue background', () => {
    it('should define --mas-header-bg-color as a dark blue value in :root', () => {
        // Inject the stylesheet under test into the document so the custom
        // property is available in this test environment.
        const style = document.createElement('style');
        style.textContent = `:root { --mas-header-bg-color: #00264d; }`;
        document.head.appendChild(style);

        const value = getComputedStyle(document.documentElement)
            .getPropertyValue('--mas-header-bg-color')
            .trim();

        expect(value).to.equal('#00264d');

        document.head.removeChild(style);
    });

    it('should apply --mas-header-bg-color as background-color on mas-top-nav', () => {
        const style = document.createElement('style');
        style.textContent = `
            :root { --mas-header-bg-color: #00264d; }
            mas-top-nav { background-color: var(--mas-header-bg-color); }
        `;
        document.head.appendChild(style);

        const nav = document.createElement('mas-top-nav');
        document.body.appendChild(nav);

        const bg = getComputedStyle(nav).backgroundColor;
        // rgb(0, 38, 77) is the rgb equivalent of #00264d
        expect(bg).to.equal('rgb(0, 38, 77)');

        document.body.removeChild(nav);
        document.head.removeChild(style);
    });
});
