import { adminInputs } from "../../fixtures/UX.data/UI Elements.data"
import { userInteraction } from "../../support/UI.Support/InteractiveMethods"

describe('interaction with Radio Buttons and Dropdowns on Admin Page', () => {

  /* 
  OBJECTIVES:
  1. Verify that all radio buttons and checkboxes on the Admin page are visible and selectable.
  2. Ensure labels for radio/checkbox controls match the expected text.
  3. Confirm dropdowns can be selected by value (or visible text) and persist after selection.
  4. Validate that dropdowns contain at least one option.
  */

  it('1. HAPPY PATH - validate that Radio Buttons and Dropdowns work on Admin Page', () => {
    cy.visit('admin.htm')
    userInteraction.validateInput(adminInputs)

  })
})