/**
 * viewportSmokeTest(viewports)
 *
 * Cycles through a list of viewport configs and ensures that the core
 * page structure (header, left, body, footer) is visible at each size.
 *
 * @param {Array} viewports - array of viewport objects, each shaped like:
 *   { preset: 'iphone-6', name: 'iPhone 6' }
 *   { width: 1280, height: 720, name: 'HD Desktop' }
 */
export function viewportSmokeTest(viewports) {
  // Wrap the array so Cypress can iterate over it
  cy.wrap(viewports).each(size => {
    cy.then(() => {
      // Destructure viewport object into convenient variables
      const { preset, width, height, name } = size

      // LOG: human-friendly viewport label (name or WxH)
      cy.log(`Viewport: ${name || `${width}x${height}`}`)

      // ACT: set the viewport
      if (typeof preset === 'string') {
        cy.viewport(preset)           // use a named Cypress preset
      } else {
        cy.viewport(width, height)    // fall back to explicit size
      }

      // GET + ASSERT: load the home page and ensure key layout panels exist
      cy.visit('/')
      cy.get('#headerPanel').should('be.visible')
      cy.get('#leftPanel').should('be.visible')
      cy.get('#bodyPanel').should('be.visible')
      cy.get('#footerPanel').should('be.visible')
    })
  })
}
