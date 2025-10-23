export class AllPOSTRequests {

    buyPosition({ customerId, accountDetails }) {
        const {
            accountId,
            name,
            symbol,
            shares,
            positionId,
            pricePerShare
        } = accountDetails
        return cy.request({
            method: 'POST',
            url: `services/bank/customers/${customerId}/buyPosition`,
            qs: { accountId, name, symbol, shares, pricePerShare, positionId },
            headers: { 'Accept': 'application/json' },
            failOnStatusCode: false
        })
    }

    createAccount({ customerId, newAccountType, fromAccountId }) {
        return cy.request({
            method: 'POST',
            url: '/services/bank/createAccount',
            qs: { customerId, newAccountType, fromAccountId },
            failOnStatusCode: false,
            headers: {
                'Accept': 'application/json'
            }

        })

    }

    initializeDatabase() {
        return cy.request({
            method: 'POST',
            url: '/services/bank/initializeDB',
            headers: { 'Accept': 'application/json' },
            failOnStatusCode: false
        })
    }



    makeDeposit({ accountId, amount }) {
        return cy.request({
            method: 'POST',
            url: `/services/bank/deposit`,
            qs: { accountId, amount },
            failOnStatusCode: false,
            headers: {
                'Accept': 'application/json'
            }
        })

    }

    postBillPay({ payload, accountId, amount }) {
        return cy.request({
            method: 'POST',
            url: '/services/bank/billpay',
            qs: { accountId, amount },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: payload,
            failOnStatusCode: false
        })
    }

    postWithdraw({ accountId, amount }) {
        return cy.request({
            method: 'POST',
            url: `/services/bank/withdraw`,
            qs: { accountId, amount },
            headers: { 'Accept': 'application/json' },
            failOnStatusCode: false

        })
    }

    requestALoan({ accountDetails }) {
        const {
            customerId,
            amount,
            downPayment,
            fromAccountId,
        } = accountDetails

        return cy.request({
            method: 'POST',
            url: '/services/bank/requestLoan',
            qs: {
                customerId,
                amount,
                downPayment,
                fromAccountId
            },
            headers: { 'Accept': 'application/json' },
            failOnStatusCode: false
        })
    }


    sellPosition({ customerId, accountDetails }) {
        const {
            accountId,
            positionId,
            shares,
            pricePerShare
        } = accountDetails

        return cy.request({
            method: 'POST',
            url: `/services/bank/customers/${customerId}/sellPosition`,
            qs: { accountId, positionId, shares, pricePerShare },
            headers: { 'Accept': 'application/json' },
            failOnStatusCode: false
        })
    }


    transferFunds({ fromAccountId, toAccountId, amount }) {
        return cy.request({
            method: 'POST',
            url: '/services/bank/transfer',
            qs: { fromAccountId, toAccountId, amount },
            failOnStatusCode: false,
        })
    }


    updateCustomerInformation({ customerId, payload }) {
        //the helper accepts either a flat or flattens a nested payload 

        const {
            firstName,
            lastName,
            //prefers flat fields if present. 
            street,
            city,
            state,
            zipCode,

            phoneNumber,
            ssn,
            username,
            password,
            address = {} //otherwise will collect these as nested address properties. 
        } = payload

        return cy.request({
            method: 'POST',
            url: `/services/bank/customers/update/${customerId}`,
            //GET: the endpoint expects params in the query string; this will be populated from payload object. 
            qs: {
                firstName,
                lastName,
                street: street ?? address.street,
                city: city ?? address.city,
                state: state ?? address.state,
                zipCode: zipCode ?? address.zipCode,
                phoneNumber,
                ssn,
                username,
                password
            },
            //ASSERT: preference for JSON 
            headers: { 'Accept': 'application/json' },
            failOnStatusCode: false
        })
    }





}
export const postRequests = new AllPOSTRequests()
