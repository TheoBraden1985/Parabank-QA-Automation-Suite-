import { dynamicForm } from "../../support/Form/Userflow Support/dynamicForm"
import { formInput } from "../../fixtures/Form.data/formInput.data"


describe.only('Validate the registration user flow', () => {
    beforeEach(() => {
        cy.visit('/register.htm')
    })

    it('1. HAPPY PATH - All fields are filled', () => {
    
    /* 
    OBJECTIVES:
    1. Complete all registration fields with valid data.
    2. Submit and verify the welcome/confirmation area shows the new username.
    3. Ensure generated username logic (if used) is reflected in the UI.
    */

        cy.registerTestUser(formInput.registrationInput).then(({ username, password }) => {
            cy.contains('#rightPanel', `Welcome ${username}`).should('be.visible')
        })
    })


    const missingFields = [
        { id: 2, mutate: d => delete d['customer.firstName'], msg: 'First name is required.' },
        { id: 3, mutate: d => delete d['customer.lastName'], msg: 'Last name is required.' },
        { id: 4, mutate: d => delete d['customer.address.street'], msg: 'Address is required.' },
        { id: 5, mutate: d => delete d['customer.address.city'], msg: 'City is required.' },
        { id: 6, mutate: d => delete d['customer.address.state'], msg: 'State is required.' },
        { id: 7, mutate: d => delete d['customer.address.zipCode'], msg: 'Zip Code is required.' },
        { id: 8, mutate: d => delete d['customer.ssn'], msg: 'Social Security Number is required.' },
        { id: 9, mutate: d => delete d['customer.username'], msg: 'Username is required.', enableGenerateUser: false },
        { id: 10, mutate: d => delete d['customer.password'], msg: 'Password is required.' },
        { id: 11, mutate: d => delete d['repeatedPassword'], msg: 'Password confirmation is required.' },
    ]
    missingFields.forEach(({ id, mutate, msg }) => {

    /* 
    OBJECTIVES:
    1. Omit one required field and attempt registration.
    2. Assert the specific validation error for the missing field.
    3. Ensure no account is created and the user remains on the form.
    */
        it(`${id}. NEGATIVE PATH - Missing Field: ${msg}`, () => {
            const data = { ...formInput.registrationInput }
            mutate(data)
            cy.attemptRegistration({ data, message: msg })
        })
    })


    it('12. NEGATIVE PATH - Registration without entering phone number', () => {

    /* 
    OBJECTIVES:
    1. Omit phone number (optional field) and submit registration.
    2. Assert registration still succeeds (no validation error expected).
    3. Verify welcome/confirmation is displayed.
    */

        const data = { ...formInput.registrationInput }
        delete data['customer.phoneNumber']

        cy.visit('/register.htm')
        dynamicForm('#customerForm', data)
        cy.get('.button[value="Register"]').click()
        cy.contains('This username already exists.').should('be.visible') //phone number is not required. 

    })

    it('13. NEGATIVE PATH - Password and password confirmation mismatch', () => {

    /*
    OBJECTIVES:
    1. Provide non-matching password and confirmation values.
    2. Submit and assert the “passwords did not match” error is shown.
    3. Ensure the form does not submit and remains on the registration page.
    */
        const bad = { ...formInput.registrationInput, repeatedPassword: 'secret125' }
        cy.attemptRegistration({ data: bad, message: 'Passwords did not match' })
    })
})

