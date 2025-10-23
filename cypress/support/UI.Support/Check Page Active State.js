import { mainMenuPages } from "../../fixtures/URL.data/mainMenuLinks.data"


export function confirmPageActiveState(
  pages,
  {
    activeClass = 'active',
    ariaCurrent = 'page',
    activeAnySelector = 'ul.leftmenu a.active, ul.leftmenu a[aria-current="page"]',
  } = {}
) {
  cy.wrap(pages).each(({ selector, label, destination }) => {
    cy.visit(destination) // navigate to the page

    cy.get(selector)
      .should('be.visible')
      .and('have.attr', 'href')
      .and(($a) => {
        const activeClassExists = $a.hasClass(activeClass)
        const ariaAttr = $a.attr('aria-current')
        const ariaAttributeExists = ariaAttr === ariaCurrent

        cy.log(
          `[${label}] activeClass=${activeClassExists}, aria-current=${ariaAttr}`
        )
        expect(
          activeClassExists || ariaAttributeExists,
          `Expected either .${activeClass} or aria-current="${ariaCurrent}"`
        ).to.be.true
      })

    // Ensure only one "active" marker in menu
    cy.get(activeAnySelector).should('have.length', 1)
  })
}
