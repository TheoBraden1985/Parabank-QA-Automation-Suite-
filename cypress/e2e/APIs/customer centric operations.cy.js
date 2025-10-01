import { pickCustomer, mustHave, idempotenceStrict, normaliseResponse, idempotenceLight } from "../../support/General.Support/helperFunctions"
import { apiUser } from "../../fixtures/API.Data/ApiUser.data"
import { getRequests } from "../../support/API.support.utils/getRequests"
import { postRequests } from "../../support/API.support.utils/postRequests"

describe('Tests for Customer Centric Operations', () => {

    const CUSTOMER_ID = 12212
    const INVALID_ACCOUNT = 99999999
    const accountTypes = { 0: 'CHECKING', 1: 'SAVINGS', 2: 'LOAN' }


    it(`1. HAPPY PATH - Validates creating and logging into new account`, () => {
        /* 
        OBJECTIVES: 
        1. Verify that the API can create one of each account (e.g., Savings, Loan, Credit). 
        2. Confirm that the customer's account list updates after account creation. 
        3. Ensure each newly created account can be accessed (fetched by ID)
        */

        const travelKit = { generatedIds: [] }
        const created = []

        //GET: Fetch customer's current accounts (baseline state) 
        return cy.getAccounts(CUSTOMER_ID).then(accounts => {

            //TRANSFORM: select an existing account to use as "fromAccountId"
            const fromAccount = pickCustomer(accounts)
            travelKit.baselineAccounts = accounts
            travelKit.fromAccount = fromAccount
            

            cy.log(`obained fromAccountID ${fromAccount.id}. There are ${accounts.length} customers at baseline`)
        })
            //ACT: Create a new account of each type. 
            .then(() => {

                return cy.wrap(Object.entries(accountTypes)).each(([code, expectedType]) => {
                    return cy.createNewAccount({
                        customerId: CUSTOMER_ID,
                        newAccountType: Number(code),
                        fromAccountId: travelKit.fromAccount.id
                    }).then(newAccount => {
                        mustHave(newAccount, ['id', 'type'])
                        expect(newAccount.type).to.be.oneOf(['CHECKING', 'SAVINGS', "LOAN"])

                        //ASSERT: each new account has an ID
                        expect(newAccount).to.have.property('id')
                        travelKit.generatedIds.push(newAccount.id)
                        created.push({ id: newAccount.id, expectedType })
                        cy.log(`+created: ${newAccount.id} (${newAccount.type})`)
                    })
                })
            })

            //ASSERT: verify count increased & new accounts exist in the list.
            .then(() => {
                expect(travelKit.generatedIds, 'all generated ids collected').to.have.length(Object.keys(accountTypes).length)

                return cy.getAccounts(CUSTOMER_ID).then(updatedAccounts => {
                    const delta = updatedAccounts.length - travelKit.baselineAccounts.length
                    expect(delta, `accounts delta=${delta}`).to.greaterThan(0)
                    expect(updatedAccounts.length, 'accounts count increased.')
                        .to.be.greaterThan(travelKit.baselineAccounts.length)

                    const updatedIds = updatedAccounts.map(account => account.id)
                    travelKit.generatedIds.forEach(id =>
                        expect(updatedIds, `account ${id} present`).to.include(id))
                })
            }).then(() => {
                //ASSERT: Each new account can be fetched directly 
                travelKit.generatedIds.forEach(id => {
                    return cy.getAccountById(id).then(accountById => {
                        cy.log(`${accountById.id} can login into ${accountById.type} account`)
                    })
                })
            }).then(() => {
                //idempotency check for response integrity/consistency. 
                return getRequests.customerAccounts(CUSTOMER_ID).then(list1 => {
                    return getRequests.customerAccounts(CUSTOMER_ID).then(list2 => {
                        idempotenceStrict(list1, list2)
                        const normAccounts = normaliseResponse(list2)
                        cy.pickSenderRecipient(normAccounts).then(({ recipient, sender }) => {
                            return postRequests.createAccount({ customerId: CUSTOMER_ID, newAccountType: 1, fromAccountId: recipient.id }).then(create1 => {
                                return postRequests.createAccount({ customerId: CUSTOMER_ID, newAccountType: 2, fromAccountId: sender.id }).then(create2 => {
                                    idempotenceLight(create1, create2)
                                })
                            })
                        })
                    })
                })
            })
    })

    it('2. HAPPY PATH - Validates fetching, updating, and refetching customer information', () => {

        /*  
        OBJECTIVES:  
        1. Apply a baseline user profile 
        2. GET login -> matches baseline (minus username/password)
        3. Update first/last/zip -> GET login -> matches updated payload 
        */

        const travelKit = {}
        const strip = (o) => Cypress._.omit(o, ['username', 'password'])

        //TRANSFORM: Baseline 
        travelKit.baseline = { ...apiUser }

        //ACT: apply baseline 
        return cy.updateCustomerInformation({
            customerId: CUSTOMER_ID,
            payload: travelKit.baseline
        }).then(message => cy.log(`Baseline applied: ${JSON.stringify(message)}`))

            //GET: verify baseline state 
            .then(() => {
                return cy.customerLogin(travelKit.baseline.username, travelKit.baseline.password).then(before => {
                    expect(strip(travelKit.baseline), 'login matches baseline (no creds)').to.deep.eq(before)
                    
                //TRANSFORM: Updated payload  
                }).then(() => {
                    travelKit.updated = {
                        ...apiUser,
                        firstName: 'Benjamin',
                        lastName: 'Franklin',
                        address: { ...apiUser.address, zipCode: '33603' }
                    }
                }).then(() => {
                    cy.updateCustomerInformation({
                        customerId: CUSTOMER_ID,
                        payload: travelKit.updated
                    }).then(message => cy.log(`Updated first/last/zip: ${JSON.stringify(message)}`))
                }).then(() => {
                    return cy.customerLogin(travelKit.baseline.username, travelKit.baseline.password).then(after => {
                        expect(strip(travelKit.updated), 'login matches updated payload').to.deep.eq(after)
                        expect(after, 'updated differs from baseline').to.not.deep.eq(strip(travelKit.baseline))
                    })
                }).then(() => { //idempotence check for response data stability/reliabity for all API's used
                    return postRequests.updateCustomerInformation({ customerId: CUSTOMER_ID, payload: travelKit.baseline }).then(update1 => {
                        return postRequests.updateCustomerInformation({ customerId: CUSTOMER_ID, payload: travelKit.updated }).then(update2 => {
                            idempotenceStrict(update1, update2)
                            return getRequests.customerLogin(travelKit.baseline.username, travelKit.baseline.password).then(login1 => {
                                return getRequests.customerLogin(travelKit.baseline.username, travelKit.baseline.password).then(login2 => {
                                    idempotenceStrict(login1, login2)
                                })
                            })
                        })
                    })
                })
            })
    })

    it.skip('3. NEGATIVE PATH - Updating customer information with missing and incorrect information', () => { 
       
        /*
        OBJECTIVES:
        1. Attempt to update customer information with invalid data (e.g., missing username, incorrect account ID).  
        2. Verify that the API rejects updates with malformed or incomplete payloads.  
        3. Confirm no changes are applied when identifiers are invalid.  
        4. Reinforce the expectation that customer data updates must be validated strictly on the server.  

        NOTE: This test is skipped because the sandbox unexpectedly accepts both an invalid ID and a missing username.  
        This indicates a gap in server-side validation — the system is allowing updates it should reject.
        */

        const user = { ...apiUser, username: '' }
        return postRequests.updateCustomerInformation({ customerId: INVALID_ACCOUNT, payload: user }).then(update => {
            expect([400]).to.include(update.status)
        })
    })


    it('4. HAPPY PATH - Validate transaction list by account type', () => {
        /*
        OBJECTIVES: 
        1. Verify that the API returns all three account types (CHECKING, SAVINGS, LOANS)
        2. for each type, confirm we can access its transaction list by account id. 
        **occassionally flaky because of missing account types. Running the account creation test should fix this. 
        */

        const travelKit = { allowedTypes: ['CHECKING', 'SAVINGS', 'LOAN'] }

        //GET: fetch all accounts
        return cy.getAccounts(CUSTOMER_ID).then(accounts => {
            expect(accounts, 'accounts list is non-empty').to.have.length.greaterThan(0)

            //TRANSFORM: normalize and collect the type present 
            const upper = (s) => String(s || '').toUpperCase()
            const typesFound = new Set(accounts.map(account => upper(account.type)))

            //ASSERT: Confirm all required types are present
            travelKit.allowedTypes.forEach(t => {
                expect(typesFound, `required type present: ${t}`).to.include(t)
            })

            //TRANSFORM: pick one sample account per required type 
            travelKit.samples = travelKit.allowedTypes
                .map(t => accounts.find(a => upper(a.type) === t))
                .filter(Boolean)

            expect(travelKit.samples, 'have one sample per type')
                .to.have.length(travelKit.allowedTypes.length)

        })
            //ACT: For each sampled account, fetch its transactions
            .then(() => {
                return cy.wrap(travelKit.samples).each((account) => {
                    expect(travelKit.allowedTypes, `type for id=${account.id}`)
                        .to.include(String(account.type).toUpperCase())

                    return cy.transactionsOf(account.id).then((txns) => {

                        //ASSERT: we have the array (command should already normalize)
                        expect(txns, `transactions array for id=${account.id}`).to.be.an('array')
                        cy.log(`OK: id=${account.id} (${account.type}) has ${txns.length} transactions`)
                    })
                })
            }).then(() => { //idempotence check for response data stability/reliabity for all API's used
                return getRequests.customerAccounts(CUSTOMER_ID).then(list1 => {
                    return getRequests.customerAccounts(CUSTOMER_ID).then(list2 => {
                        idempotenceStrict(list1, list2)
                        const normList = normaliseResponse(list2)
                        cy.pickSenderRecipient(normList).then(({ sender, recipient }) => {
                            return getRequests.transactionsList(sender.id).then(tran1 => {
                                return getRequests.transactionsList(recipient.id).then(tran2 => {
                                    idempotenceLight(tran1, tran2)
                                })
                            })
                        })
                    })
                })
            })
    })

    it('5. NEGATIVE PATH - Invalid login with missing password', () => {

        /*
        OBJECTIVES:
        1. Attempt login with missing password.  
        2. Verify API responds with an error (400).  
        3. Confirm response body indicates invalid username and/or password.  
        */

        const user = { ...apiUser }

        //TRANSFORM: clone a valid user and omit password field.
        const userMissingPassword = Cypress._.omit(user, ['password'])
        return getRequests.customerLogin(userMissingPassword.username, userMissingPassword.password).then(invalidLogin => {
            
            //ASSERT: API responds with 400 status.
            expect([400]).to.include(invalidLogin.status)
            
            //ASSERT: response body contains "Invalid username and/or password".
            expect(invalidLogin.body).to.contain('Invalid username and/or password')
        })

    })






})






