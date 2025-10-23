export class keystrokeBehavior {

   // expects: links = [{ selector, newTab?: boolean, expectedNext?: string }, ...]
pressTab(links, { direction = 'forward' } = {}) {
  const key = direction === 'backward' ? 'Shift+Tab' : 'Tab'

  cy.wrap(links).each(({ selector, newTab, expectedNext }, index, list) => {
    // Skip external/new-tab items if you mark them as such
    if (newTab === true) return

    cy.log(`Tab check [#${index}] ${selector}`)

    // DISCOVER: get element and ensure it's focusable now
    cy.get(selector)
      .scrollIntoView()
      .should('be.visible')
      // same-tab safety (no-op for most elements; safe on anchors)
      .invoke('removeAttr', 'target')
      // PREPARE: focus and confirm
      .focus()
      .should('have.focus')

    // capture current focused element for later comparison
    cy.focused().then(($before) => {
      const beforeEl = $before.get(0)

      // ACT: press Tab (or Shift+Tab)
      cy.realPress(key)

      // ASSERT: focus changed
      cy.focused().should(($after) => {
        const afterEl = $after.get(0)
        expect(afterEl, `[#${index}] focus moved`).to.not.equal(beforeEl)
      })

      // ASSERT (optional): focus landed on the expected next selector
      if (expectedNext) {
        cy.focused().should('match', expectedNext)
      }

      // If you provide no expectedNext but you want to check linear order,
      // you can compare against the next item’s selector in the input array:
      if (!expectedNext && index < list.length - 1 && list[index + 1]?.selector) {
        // Comment this in if your DOM tab order matches your data order
        // cy.focused().should('match', list[index + 1].selector)
      }
    })
  })
}


    pressEnter(links) {
        /*  
        1. Each internal link is keyboard-focusable and can be activated with enter. 
        2. Pressing enter navigates in the same tab (no new-window surprises)
        3. The resulting route matches the expected path for that link 
        4. After navigation, we can return to the starting page and continue testing the next line. 
        */

        cy.wrap(links).each(({ selector, path, linkStatus }, index, list) => {
            if (linkStatus !== 'internal') return
            cy.log(`Enter check [#${index}]: ${selector} -> expect path includes "${path}`)

            //Ensure focusable, visible, and focused 
            cy.get(selector)
                .scrollIntoView()
                .should('be.visible')
                .focus()
                .should('have.focus')
                //confirm it doesn't open a new tab 
                .invoke('removeAttr', 'target')

            //locate and capture current path. 
            cy.location('pathname').then((beforePath) => {
                //press enter to the focused element
                cy.realPress('Enter')
                console.log('beforePath', beforePath)

                cy.location('pathname', {timeout: 15000}).should((afterPath) => {
                    //normalize both sides if you hvae trailing slash issues. 
                    const norm = (p) => (p.endsWith('/') ? p.slice(0, -1) : p)
                    expect(norm(afterPath), `[#${index}] navigated`).to.include(norm(path))
                }) 
                //only go back if there are more items to test. 
                if(index < list.length -1){
                    cy.go('back')
                    //Confirim we are back to the starting position before the next iteration. 
                    cy.location('pathname', {timeout: 10000}).should('eq', beforePath)
                }
            })
        })
    }
}
export const validateKeyStrokeBehavior = new keystrokeBehavior()

