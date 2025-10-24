import { validateKeyStrokeBehavior } from "../../support/UI.Support/TabbingBehavior"
import { mainMenuPages } from "../../fixtures/URL.data/mainMenuLinks.data"
import { topNavLinks } from "../../fixtures/URL.data/topNavLinks.data"
import { footerMenuLinks } from "../../fixtures/URL.data/footerLinks.data"
import { confirmPageActiveState } from "../../support/UI.Support/checkPageActiveState"

describe('Evaluating tabbing behavior to determine accessibility', () => {


    beforeEach(() => {
        cy.visit('/')

    })

    const menus = [
        { name: 'TOP NAV MENU', data: topNavLinks },   // tests #1 and #2
        { name: 'MAIN MENU', data: mainMenuPages }, // tests #3 and #4
        { name: 'FOOTER MENU', data: footerMenuLinks } // tests #5 and #6
    ]

    menus.forEach(({ name, data }, i) => {

        /* 
        OBJECTIVES (applies to all TAB/ENTER tests across menus):
        1. Ensure all links are keyboard accessible.
        2. Verify that TAB moves focus sequentially across links in each menu.
        3. Confirm that focused elements are visible and interactable.
        4. Validate that pressing ENTER activates the focused link and navigates correctly.
        */

        it(`${i * 2 + 1}.Validates pressing TAB on ${name}`, () => {
            validateKeyStrokeBehavior.pressTab(data)
        })

        it(`${i * 2 + 2}.Validates pressing ENTER on LINKS in ${name}`, () => {
            validateKeyStrokeBehavior.pressEnter(data)
        })
    })


    it('7. Validates visible focus ring on link or button across menus', () => {

        /* 
        OBJECTIVES:
        1. Confirm that when elements (links/buttons) are focused via keyboard, they display a visible focus indicator (focus ring).
        2. Ensure focus indicators (outline color and style) are not removed by CSS overrides.
        3. Provide accessibility compliance by guaranteeing sighted keyboard users can track focus.
        */

        const topNavButtonSelector = '.button a[href*="index.htm"]'
        const mainMenuLinkSelector = 'ul.leftmenu a[href*="services.htm"]'
        const FooterMenuLinkSelector = '#footerPanel a[href*="contact.htm"]'

        const selectorArray = [topNavButtonSelector, mainMenuLinkSelector, FooterMenuLinkSelector]

        cy.wrap(selectorArray).each((selector) => {
            cy.get(selector).focus()
                .focused()
                .invoke('css', 'outlineColor')
                .then((outlineColor) => {
                    cy.log(`outline Color, ${outlineColor}`)
                    expect(outlineColor).to.not.equal('none')
                })
                .then((outlineStyle) => {
                    cy.log(`outlineStyle, ${outlineStyle}`)
                    expect(outlineStyle).to.not.equal('none')
                })
        })

    })

    it.skip('8. evaluating the presenece of labelling controls', () => {

        /* 
        OBJECTIVES:
        1. Verify that form controls (input, textarea, select) have associated <label> elements linked by for/id.
        2. Identify unlabeled controls, which break accessibility guidelines for screen reader users.
        3. Document failures as known issues (test is skipped due to ParaBank not implementing labels).
        NOTE: Skipped because parabank has not implemented the field label feature yet. 
        */

        cy.visit('/contact.htm')
        cy.get('#contactForm')
            .find('input, textarea, select')
            .each($el => {
                const id = $el.attr('id')
                if (id) {
                    cy.get(`label[for="${id}"]`).should('exist').then(() => {
                        cy.log(`Field with ID = "${id}" has a label`)
                    })
                } else {
                    cy.log(`field without id:`, $el[0].outerHTML)
                }
            })
    })



    it.skip('9. Checkpage active state on left menu', () => {

        /* OBJECTIVES:
        1. Verify that the active state in the left menu reflects the current page.
        2. Check for both CSS-based `active` class and `aria-current="page"` attribute.
        3. Note: This test is skipped, as ParaBank does not implement an active state indicator.
        */

        const internalPages = (mainMenuPages).filter(page => page.linkStatus == 'internal')
        confirmPageActiveState(internalPages)
    })






})
