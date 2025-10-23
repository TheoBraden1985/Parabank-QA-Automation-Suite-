
describe('testing miscellaneous issues', () => {
    beforeEach(() => {
        cy.visit('/')
    })

    it('1. Validate that Logo image is intact', () => {
  
    /* 
    OBJECTIVES:
    1. Ensure the bank logo image is present and visible in the header.
    2. Verify that the logo’s `src` attribute points to a valid resource.
    3. Confirm logo resource loads successfully (HTTP status 2xx–3xx).
    */

        cy.get('#topPanel img.logo').as('logo')
            .should('be.visible')
            .invoke('attr', 'src').then(src => {
                cy.request(src).its('status').should('be.within', 200, 399)
            })
    })

    it('2. Form Fields should have unique ID', () => {

    /* 
    OBJECTIVES:
    1. Check that all form fields in the registration form have unique IDs.
    2. Prevent duplication of `id` attributes which could cause accessibility or testability issues.
    3. Compare list length vs. unique Set length to confirm no duplicates.
    */

        cy.visit('/register.htm')
        cy.get('#customerForm [id]').then($el => {
            const ids = $el.map((i, el) => el.id).get()
            const unique = new Set(ids)
            expect(ids.length).to.eq(unique.size)
        })
    })

  
 

})