import { generateUsername } from "./generateNewUser"

/**
 * dynamicForm(formSelector, data, options)
 *
 * Fills any <input>, <select>, and <textarea> inside `formSelector`
 * using keys from `data` that match each field's name (or id).
 *
 * - If `enableGenerateUser` is true and the field is `customer.username`,
 *   we generate a unique username from the provided seed value.
 * - If `triggerBlurMissing` is true, we focus+blur fields that have no value
 *   in `data` to surface required/validation messages.
 *
 * Returns: a Cypress chain yielding the final username (or null) so you can
 *   use `.then(username => ...)` after calling this helper.
 */
export function dynamicForm(
  formSelector,
  data,
  { enableGenerateUser = false, triggerBlurMissing = true } = {}
) {
  // Will hold the auto-generated username when applicable
  let finalUserName = null

  // GET: scope into the form container and ensure it's usable
  return cy.get(formSelector)
    .should('exist')
    .and('be.visible')
    .within(() => {
      // DISCOVER: iterate all form controls inside the form
      cy.get('input, select, textarea').each(($el, i) => {
        // Identify the logical key for this control
        const nameAttr = $el.attr('name') || $el.attr('id')
        const tag = ($el.prop('tagName') || '').toLowerCase()
        const type = ($el.prop('type') || '').toLowerCase()

        // Look up the value in the provided data map by name/id
        let value = data[nameAttr]

        // Debug trace in the browser console (useful when mapping breaks)
        console.log(`[dynamicForm][${i}] name/id="${nameAttr}", tag=${tag}, type=${type}, value=`, value)

        // TRANSFORM: optionally generate a unique username on the fly
        if (nameAttr === 'customer.username' && enableGenerateUser && value) {
          value = generateUsername(value)
          finalUserName = value
        }

        // ACT: fill the control when a value is provided for this key
        if (value !== undefined) {
          const isEmptyString = typeof value === 'string' && value.trim() === ''

          if (tag === 'select') {
            // Select dropdown by value (value attribute)
            cy.wrap($el)
              .select(String(value))
              .should('have.value', String(value))

          } else if (type === 'checkbox' || type === 'radio') {
            // For booleans, check/uncheck accordingly (supports true/false)
            // If you always want "checked", keep your original line instead.
            const shouldCheck = value === true || value === 'true' || value === 1 || value === '1' || value === String($el.val())
            if (shouldCheck) {
              cy.wrap($el).check({ force: true }).should('be.checked')
            } else if (type === 'checkbox') {
              cy.wrap($el).uncheck({ force: true }).should('not.be.checked')
            }

          } else if (type !== 'submit') {
            // If we explicitly want to send empty string, clear + blur to trigger "required" UI
            if (isEmptyString && triggerBlurMissing) {
              cy.wrap($el)
                .clear()
                .should('have.value', '')
                .focus()
                .blur()
            } else {
              // Default text-like input behavior
              cy.wrap($el)
                .clear()
                .type(String(value))
                .should('have.value', String(value))
            }
          }

        } else if (triggerBlurMissing && type !== 'submit') {
          // ASSERT (UX): no value provided → poke validation by focus/blur
          cy.wrap($el)
            .should('be.visible')
            .focus()
            .blur()
        }
      })
    })
    // RETURN: expose the generated username to the caller (or null)
    .then(() => cy.wrap(finalUserName))
}
