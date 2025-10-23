import { formInput } from "../../fixtures/Form.data/formInput.data"
import { dynamicForm } from "../../support/Form/Userflow Support/dynamicForm"

describe('Validate the Contact Form Userflow', () => {

    it('1. HAPPY PATH - Validate all fields on contact form', () => {
        
        /* 
        OBJECTIVES:
         1. Fill out all required contact form fields with valid data.
         2. Submit the form and verify the success confirmation message.
         3. Ensure no validation errors appear when all inputs are present.
         */

        //ACT: Fill and submit 
        cy.contactFormUser(formInput.contactFormInput).then(() => {
            //ASSERT is inside the command. 
        })
    })

    const blanks = [
        { id: 2, mutate: d => delete d['name'], msg: 'Name is required' },
        { id: 3, mutate: d => delete d['email'], msg: 'Email is required' },
        { id: 4, mutate: d => delete d['phone'], msg: 'Phone is required' },
        { id: 5, mutate: d => delete d['message'], msg: 'Message is required' },

    ]

    blanks.forEach(({ id, mutate, msg }) => {

        /* 
        OBJECTIVES:
         1. Omit various fields while filling out the contact form.
         2. Submit the form and verify that an error message for "Name is required" appears.
         3. Confirm the form does not submit successfully.
         */
        
        it(`${id}. NEGATIVE PATH - Missing field: ${msg}`, () => {
            //TRANSFORM: create a data variant with one field removed. 
            const data = { ...formInput.contactFormInput }
            mutate(data)
            //ACT + ASSERT 
            cy.attemptContactForm({ data, message: msg })

        })
    })

    it.skip('6. NEGATIVE PATH - Invalid email address entry', () => { 
    
        /* OBJECTIVES:
        1. Enter an invalid email format and submit the contact form.
        2. Assert an appropriate validation error is shown for the email field.
        3. NOTE: Skipped due to site accepting invalid emails (known limitation).
        */

        const bad = { ...formInput.contactFormInput, email: 'this-is-not-an-email' }
        cy.attemptContactForm({ data: bad, message: 'Please enter a valid email address' })
    })



})