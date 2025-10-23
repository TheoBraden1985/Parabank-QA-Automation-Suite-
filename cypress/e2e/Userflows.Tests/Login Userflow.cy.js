import { formInput } from "../../fixtures/Form.data/formInput.data";
import { dynamicForm } from "../../support/Form/Userflow Support/dynamicForm";

describe.only('Validate the Login Userflow', () => {

    it('1. HAPPY PATH - Validate correct login', () => {

        /* 
        OBJECTIVES:
        1. Register a user (precondition) and perform a valid login.
        2. Assert successful login by checking the Accounts Overview page.
        3. Ensure username/password inputs behave as expected (visible, typeable).
        */

        cy.registerTestUser(formInput.registrationInput).then(({ username, password }) => {
            cy.get('#leftPanel a[href="logout.htm"]').click()
            cy.get('#leftPanel').within(() => {
                cy.contains('h2', 'Customer Login').should('be.visible')
            })

            // ACT: login with the new creds
            cy.get('input[name="username"]').should('be.visible').type(String(username))
            cy.get('input[name="password"]').should('be.visible').clear().type(String(password))
            cy.get('.button[value="Log In"]').should('be.visible').click()

            // ASSERT: landed on Accounts Overview
            cy.contains('.title', 'Accounts Overview').should('be.visible')
        })
    })

    it('2. HAPPY PATH - Block access to account page after logging out', () => {

        /* 
        OBJECTIVES:
        1. Register and log in; then log out from the app.
        2. Assert the app shows the login screen after logout.
        3. (Optional) Attempt to access an authenticated page and verify redirect to login.
        */
        cy.registerTestUser(formInput.registrationInput).then(({ username }) => {
            cy.get('#leftPanel a[href="logout.htm"]').should('be.visible').click()
            cy.contains('h2', 'Customer Login').should('be.visible')
        })
    })

    it.skip('3. HAPPY PATH - Validate page resistance after reloading', () => {

        /* 
        OBJECTIVES:
        1. Register and log in; land on welcome/overview page.
        2. Reload the page and verify session/page content persists appropriately.
        3. Ensure UI elements re-render correctly post reload.
        4. NOTE: Known failiure that the page reverts to the registration page with an error message saying that the name is already in use. 
        */
        cy.visit('/register.htm')
        cy.registerTestUser(formInput.registrationInput).then(({ username }) => {
            //ASSERT: welcome persist across reload (server-rendered page. )
            cy.contains(`#rightPanel`, `Welcome ${username}`).should('be.visible')
            cy.reload()
            cy.contains(`#rightPanel`, `Welcome ${username}`).should('be.visible')
        })
    })


    it('4. NEGATIVE PATH - Validate empty login', () => {

        /* 
        OBJECTIVES:
        1. Attempt login with both username and password empty.
        2. Assert an inline error message is displayed.
        3. Ensure no navigation to an authenticated page occurs.
        */
        cy.visit('/')
        cy.get('#leftPanel').within(() => {
            cy.contains('h2', 'Customer Login').should('be.visible')
        })
        cy.get('.input[name="username"]').clear().should('have.value', '')
        cy.get('.input[name="password"]').clear().should('have.value', '')
        cy.get('.button[value="Log In"]').should('be.visible').click()

        //ASSERT: Specific error and no redirect 
        cy.contains('.error', 'Please enter a username and password.').should('be.visible')
        cy.location('pathname').should('include', '/login.htm')
    })

    it('5. NEGATIVE PATH - Validate missing username', () => {

        /* 
        OBJECTIVES:
        1. Attempt login with missing username and a provided password.
        2. Assert an inline error message is displayed.
        3. Ensure user remains on the login screen (no authenticated navigation).
        */

        cy.visit('/')
        const password = { ...formInput.registrationInput }['customer.password']

        cy.get('#leftPanel').within(() => {
            cy.contains('h2', 'Customer Login').should('be.visible')
        })
        cy.get('.input[name="username"]').clear().should('have.value', '')
        cy.get('.input[name="password"]').clear().type(String(password))
        cy.get('.button[value="Log In"]').should('be.visible').click()
        //ASSERT: same combined error and no redirect 
        cy.contains('.error', 'Please enter a username and password.').should('be.visible')
        cy.location('pathname').should('include', '/login.htm')
    })
})