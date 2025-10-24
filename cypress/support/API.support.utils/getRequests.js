export class AllGETRequests {

    accountByAccountId(accountId) {
        return cy.request({
            method: 'GET',
            url: `/services/bank/accounts/${accountId}`,
            failOnStatusCode: false,
            headers: {
                'Accept': 'application/json'
            }
        })
    }


    customerAccounts(customerId) {
        return cy.request({
            method: 'GET',
            url: `/services/bank/customers/${customerId}/accounts`,
            failOnStatusCode: false,
            headers: {
                'Accept': 'application/json'
            }
        })
    }

    customerLogin(username, password) {
        const url = `/services/bank/login/${username}/${password}`
        return cy.request({
            method: 'GET',
            url: url,
            failOnStatusCode: false,
            headers: {
                'Accept': 'application/json'
            }
        })
    }

   
    customerPositions(customerId) {
        const url = `/services/bank/customers/${customerId}/positions`
        return cy.request({
            method: 'GET',
            url: url,
            failOnStatusCode: false,
            headers: {
                'Accept': 'application/json'
            }
        })
    }

    positionById(positionId) {
        const url = `/services/bank/positions/${positionId}`
        return cy.request({
            method: 'GET',
            url: url,
            failOnStatusCode: false,
            headers: {
                'Accept': 'application/json'
            }
        })
    }

    transactionById(transactionId) {
        const url = `/services/bank/transactions/${transactionId}`
        return cy.request({
            method: 'GET',
            url: url,
            failOnStatusCode: false,
            headers: {
                'Accept': 'application/json'
            }
        })
    }

    transactionsList(accountId) {
        return cy.request({
            method: 'GET',
            url: `/services/bank/accounts/${accountId}/transactions`,
            failOnStatusCode: false,
            headers: {
                'Accept': 'application/json'
            }
        })
    }

}
export const getRequests = new AllGETRequests()
