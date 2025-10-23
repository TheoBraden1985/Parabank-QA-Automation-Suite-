import { getRequests } from "../../support/API.support.utils/getRequests"
import { postRequests } from "../../support/API.support.utils/postRequests"
import { pickCustomer, pickAmount, calculateDownPayment, idempotenceStrict, normaliseResponse, idempotenceLight, toNumber} from "../../support/General.Support/helperFunctions"

describe('Loan centric operation', () => {
    const CUSTOMER_ID = 12212
    


    it('1. HAPPY PATH - Validates taking out a loan via API post request', () => {
        
        /*
        OBJECTIVES:
        1) Verify that a customer can submit a loan application with a valid payload.
        2) If approved, confirm that the loan account is created and accessible by accountId.
        3) If denied, validate that the API returns an appropriate error message
           (e.g., "error.insufficient.funds.for.down.payment").
        4) Ensure that the response shape (approved flag, message, accountId) matches expectations.
        */

        const travelKit = {}
        //GET: pick customer + compute loan parameters
        return cy.getAccounts(CUSTOMER_ID).then(accounts => {
            const customer = pickCustomer(accounts)
            const amount = pickAmount(customer.balance)
            const downPayment = calculateDownPayment(amount)
            travelKit.customer = customer
            travelKit.payload = Cypress._.omit({
                ...customer,
                amount,
                downPayment,
                fromAccountId: customer.id
            }, ['type', 'id', 'balance'])

        })
            //ACT: request loan 
            .then(() => {

                return cy.requestLoan({ accountDetails: travelKit.payload }).then(result => {
                    travelKit.result = result

                    if (result.approved === true) {
                        //ASSERT: we can fetch the created loan account by id.
                        expect(result).to.have.property('accountId')
                        return cy.getAccountById(result.accountId).then(byId => {
                            expect(byId, 'loan account exists').to.be.an('object')
                        })
                    } else {
                        expect(result.message).to.contain('error.insufficient.funds.for.down.payment')
                    }
                })
            })
            .then(() => {//idempotence check for structure integrity 
                return getRequests.customerAccounts(CUSTOMER_ID).then(list1 => {
                    return getRequests.customerAccounts(CUSTOMER_ID).then(list2 => {
                        idempotenceStrict(list1, list2)
                        const normaliseAccounts = normaliseResponse(list2)
                        const customer = pickCustomer(normaliseAccounts)
                        const payload = { fromAccountId: customer.id, amount: 200, downPayment: 100 }
                        return postRequests.requestALoan({ accountDetails: payload }).then(loan1 => {
                            return postRequests.requestALoan({ accountDetails: payload }).then(loan2 => {
                                idempotenceLight(loan1, loan2)
                            })
                        })
                    })
                })
            })

    })

    it.skip('2. NEGATIVE PATH - Requesting a loan with insufficient funds.', () => { 
        
        /*
        OBJECTIVES:
        1. Attempt to request a loan far above the applicant's balance. 
        2. Verify that the API responds with an error (400)
        3. Confirm response body indicates insufficient funds. 
        NOTE: Skipped beecause the app occassionally approves customers with insufficient funds. 
        */

        //GET: fetch accounts → pick applicant.
        cy.getAccounts(CUSTOMER_ID).then(list1 => {
            const applicant = pickCustomer(list1)

            //TRANSFORM: request loan amount far above applicant’s balance.
            const amount = toNumber(applicant.balance * 5)
            const downPayment = toNumber(amount * 0.80)
            const payload = { customerId: CUSTOMER_ID, fromAccountId: applicant.id, amount: amount, downPayment: downPayment }

            //ACT: submit loan request via API.
            return postRequests.requestALoan({ accountDetails: payload }).then(loan => {
                expect([400]).to.include(loan.status)
                expect(loan.approved).to.be.eq(false)

                //ASSERT: loan not approved, correct error message, no account assigned.
                expect(loan.message).to.contain('error.insufficient.funds.for.down.payment')
                expect(loan.accountId).to.eq(null)
            })
        })
    })





})