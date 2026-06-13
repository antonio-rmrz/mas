import { expect } from '@esm-bundle/chai';

/**
 * Verify that the Studio header (mas-top-nav) has a black background-color
 * declared in style.css.
 *
 * We check the stylesheet rule directly because jsdom / the test runner does
 * not load external CSS files, so getComputedStyle would always return ''.
 * Asserting the rule text is the reliable, framework-agnostic approach used
 * throughout this repo's CSS-rule tests.
 */
describe('mas-top-nav background color', () => {
    it('style.css declares background-color: #000000 for mas-top-nav', async () => {
        const response = await fetch('/studio/style.css');
        const cssText = await response.text();

        // Extract the mas-top-nav rule block
        const ruleMatch = cssText.match(/mas-top-nav\s*\{([^}]*)\}/);
        expect(ruleMatch, 'mas-top-nav rule should exist in style.css').to.not.be.null;

        const ruleBody = ruleMatch[1];
        // Accept both #000000 and #000 and rgb(0,0,0) / rgb(0, 0, 0)
        const hasBlackBg =
            /background-color\s*:\s*(#000000|#000|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/.test(ruleBody);
        expect(hasBlackBg, `mas-top-nav background-color should be black, got: ${ruleBody.trim()}`).to.be.true;
    });
});
