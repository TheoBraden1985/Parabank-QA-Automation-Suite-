import { getRequests } from "./API.support.utils/getRequests";
import { expectOk, toNumber, normaliseResponse, formatAndSchema, assertTxnsSample, assertAcctsSample } from "./General.Support/helperFunctions";
import { postRequests } from "./API.support.utils/postRequests";
import { dynamicForm } from "./Form/Userflow Support/dynamicForm";
console.log('[commands] evaluated');



//API COMMANDS 

Cypress.Commands.add('buyingPosition', ({ customerId, accountDetails }) => {
    return postRequests.buyPosition({ customerId, accountDetails })
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: true }))
        .then(normaliseResponse)
})

Cypress.Commands.add('createNewAccount', ({ customerId, newAccountType, fromAccountId }) => {
    return postRequests.createAccount({ customerId, newAccountType, fromAccountId })
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: false }))
        .then(normaliseResponse)
})

Cypress.Commands.add('customerLogin', (username, password) => {
    return getRequests.customerLogin(username, password)
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: false }))
        .then(normaliseResponse)
})

Cypress.Commands.add('findTransactionById', (transactionId) => {
    return getRequests.transactionById(transactionId)
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: false }))
        .then(normaliseResponse)
})

Cypress.Commands.add('getAccounts', (customerId) => {
    return getRequests.customerAccounts(customerId)
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: true }))
        .then(normaliseResponse)
        .then(assertAcctsSample)
})

Cypress.Commands.add('getAccountById', (accountId) => {
    return getRequests.accountByAccountId(accountId)
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: false }))
        .then(normaliseResponse)
})

Cypress.Commands.add('getCustomerPositions', (customerId) => {
    return getRequests.customerPositions(customerId)
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: true }))
        .then(normaliseResponse)
})

Cypress.Commands.add('getPositionById', (customerId) => {
    return getRequests.positionById(customerId)
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: false }))
        .then(normaliseResponse)
})

Cypress.Commands.add('initializeDatabase', () => {
    return postRequests.initializeDatabase
})

Cypress.Commands.add('makeWithdraw', ({ accountId, amount }) => {
    return postRequests.postWithdraw({ accountId, amount })
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: false }))
        .then(normaliseResponse)
})

Cypress.Commands.add('pickSenderRecipient', (accounts) => {
    const sender = accounts.find(acc => toNumber(Math.abs(acc.balance)) > 500 || accounts[0])
    const recipient = accounts.find(acc => acc.id !== sender.id && acc.balance < sender.balance) || accounts[1]
    expect(sender?.id, `sender selected`).to.exist
    expect(recipient?.id, 'recipient selected').to.exist
    expect(sender.id, 'accounts are different').to.not.eq(recipient.id)
    return { sender, recipient }
})

Cypress.Commands.add('postBillPay', ({ payload, accountId, amount }) => {
    return postRequests.postBillPay({ payload, accountId, amount })
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: false }))
        .then(normaliseResponse)
})

Cypress.Commands.add('postDeposit', ({ accountId, amount }) => {
    return postRequests.makeDeposit({ accountId, amount })
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: false }))
        .then(normaliseResponse)
})

Cypress.Commands.add('requestLoan', ({ accountDetails }) => {
    return postRequests.requestALoan({ accountDetails })
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: false }))
        .then(normaliseResponse)
})

Cypress.Commands.add('sellingPosition', ({ customerId, accountDetails }) => {
    return postRequests.sellPosition({ customerId, accountDetails })
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: true }))
        .then(normaliseResponse)
})

Cypress.Commands.add('transactionsOf', (accountId) => {
    return getRequests.transactionsList(accountId)
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: true }))
        .then(normaliseResponse)
        .then(assertTxnsSample)
})

Cypress.Commands.add('transfer', ({ from, to, amount }) => {
    return postRequests.transferFunds({ fromAccountId: from, toAccountId: to, amount })
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: false }))
        .then(normaliseResponse)
})

Cypress.Commands.add('updateCustomerInformation', ({ customerId, payload }) => {
    return postRequests.updateCustomerInformation({ customerId, payload })
        .then(expectOk)
        .then(res => formatAndSchema(res, { expectArray: false }))
        .then(normaliseResponse)
})



///LOGIN COMMANDS
const User = {
    username: "mugrad25@gmail.com",
    password: "DominoBestCat2025!",
    confirm: "DominoBestCat2025!",
    firstname: "Theo",
    lastname: "Braden",
    address: "Nollendorf Street 35",
    city: "Berlin",
    state: "Wisconsin",
    zipCode: "10777",
    SSN: "999-999-9999",
}

Cypress.Commands.add('ensureLoggedIn', () => {
    cy.loginAsCurrentUser();

    cy.get('body').then(($body) => {
        const hasOverview = $body.text().includes('Account Overview');

        if (hasOverview) {
            cy.log('Already Logged in - Skip Fallback');
            return;
        }
        const invalidDetails = 'The username and password could not be verified.'
        const internalError = 'An internal Error has occurred and has been logged'

        const errors = $body.find('p.error').toArray()
        const hasError = errors.some((el) =>
            el.innerText.includes(invalidDetails) || el.innerText.includes(internalError)
        )

        if (hasError) {
            cy.log('Login failed --registering as new user instead')
            cy.registerAsNewUser()
        }
    })
})

Cypress.Commands.add('loginAsCurrentUser', () => {

    cy.visit('/')
    console.log('user', User)
    cy.get('input[name="username"]').type(User.username)
    cy.get('input[name="password"]').type(User.password)
    cy.contains('.button', 'Log In').click()
})

Cypress.Commands.add('registerAsNewUser', () => {
    cy.visit('/')
    cy.get('#loginPanel a[href="register.htm"]').click()
    cy.get('input[name="customer.firstName"]').type(User.firstname)
    cy.get('input[name="customer.lastName"]').type(User.lastname)
    cy.get('input[name="customer.address.street"]').type(User.address)
    cy.get('input[name="customer.address.city"]').type(User.city)
    cy.get('input[name="customer.address.state"]').type(User.state)
    cy.get('input[name="customer.address.zipCode"]').type(User.zipCode)
    cy.get('input[name="customer.ssn"]').type(User.SSN)
    cy.get('input[name="customer.username"]').type(User.username)
    cy.get('input[name="customer.password"]').type(User.password)
    cy.get('input[name="repeatedPassword"]').type(User.password)
    cy.contains('.button', 'Register').click()

})

/*Cypress.Commands.add('registerTestUser', (registrationInput) => {
    const input = {...registrationInput}
    const password = input['customer.password']

    cy.visit('/register.htm')
    return cy 
    .then(() => dynamicForm('#customerForm', input, {enableGenerateUser: true}))
    .then((username) => {
        cy.get('.button[value="Register"]').click()
        cy.contains('#rightPanel', `Welcome ${username}`).should('be.visible')
        return {username, password}
    })
})
*/
// cypress/support/commands.js (or a utils file you import)

Cypress.Commands.add('attemptContactForm', ({ data, message }) => {
    cy.visit('/contact.htm')
    return dynamicForm('#contactForm', data).then(() => {
        cy.get('.button[value="Send to Customer Care"]').click()
        return cy.contains(message).should('be.visible')
    })
})



Cypress.Commands.add('attemptRegistration', ({ data, message }) => {
    cy.visit('/register.htm')
    return dynamicForm('#customerForm', data).then(() => {
        cy.get('.button[value="Register"]').click()
        cy.contains(message).should('be.visible')
    })
})

Cypress.Commands.add('contactFormUser', (contactFormInput) => {
    cy.visit('/contact.htm')
    return dynamicForm('#contactForm', contactFormInput).then(() => {
        cy.get('.button[value="Send to Customer Care"]').click()
        return cy.contains(
            '#rightPanel', 'A Customer Care Representative will be contacting you'
        ).should('be.visible')
    })
})


Cypress.Commands.add('registerTestUser', (registrationInput) => {
    const input = { ...registrationInput }
    const password = input['customer.password']

    cy.visit('/register.htm')

    return dynamicForm('#customerForm', input, { enableGenerateUser: true })
        .then((username) => {
            cy.get('.button[value="Register"]').click()

            return cy
                .contains('#rightPanel', `Welcome ${username}`).should('be.visible')
                .then(() => {
                    cy.wrap({ username, password })

                })
        })

})


























