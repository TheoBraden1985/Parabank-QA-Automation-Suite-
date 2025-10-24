import { viewportSizes } from "../../fixtures/UX.data/ViewportSizes.data";
import { viewportSmokeTest } from "../../support/UI.Support/ViewportSanity";

describe('viewport sanity checks across device types', () => {

    it('1. Mobile sanity check', () => {

        /*
        OBJECTIVES:
        1. Load the home page in a mobile-sized viewport.
        2. Confirm that all key UI panels (header, left, body, footer) are visible.
        3. Ensure no critical content is missing or broken at mobile scale.
        */
        const mobileSizes = viewportSizes.filter(size => size.deviceType === 'mobile')
        viewportSmokeTest(mobileSizes, () => {
            cy.get('#footerPanel a[href*="services.htm"]').scrollIntoView().should('be.visible').click()
            cy.location('pathname').should('include', '/services.htm')
            cy.get('#bodyPanel').within(() => {
                cy.contains(/Available.*SOAP services/i).should('be.visible')
            })
        })
    })
    it('2. Tablet sanity check', () => {

        /* 
        OBJECTIVES:
        1. Load the home page in a tablet-sized viewport.
        2. Confirm that key UI panels (header, left, body, footer) remain visible.
        3. Ensure content is accessible and layout does not break at tablet scale.
        */

        const tabletSizes = viewportSizes.filter(size => size.deviceType === 'tablet')
        viewportSmokeTest(tabletSizes, () => {
            cy.get('#footerPanel a[href*="sitemap.htm"]').scrollIntoView().click()
            cy.location('pathname').should('include', '/sitemap.htm')
            cy.get('#bodyPanel').within(() => {
                cy.contains(/Account Services/i).should('be.visible')
                cy.contains(/Solutions/i).should('be.visible')
            })
        })
    })

    it('3. Desktop sanity check', () => {

        /* 
        OBJECTIVES:
        1. Load the home page in a desktop-sized viewport.
        2. Confirm that all UI panels render correctly at full resolution.
        3. Ensure the desktop view preserves layout consistency and accessibility.
        */
        const desktopSizes = viewportSizes.filter(size => size.deviceType === 'desktop')
        viewportSmokeTest(desktopSizes, () => {
            cy.get('#footerPanel a[href*="contact.htm"]').click()
            cy.location('pathname').should('include', '/contact.htm')
            cy.get('#bodyPanel').within(() => {
                cy.contains(/Customer Care/i).should('be.visible')
            })
        })
    })
})