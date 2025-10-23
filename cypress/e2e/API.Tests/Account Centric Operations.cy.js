import { getRequests } from "../../support/API.support.utils/getRequests"
import { postRequests } from "../../support/API.support.utils/postRequests"
import { pickCustomer, mustHave, pickAmount, toNumber, idempotenceLight, idempotenceStrict, normaliseResponse } from "../../support/General.Support/helperFunctions"

describe('Tests for Account Centric Operations', () => {
    const CUSTOMER_ID = 12212
    const INVALID_ACCOUNT = 99999999
    const accountTypes = { 0: 'CHECKING', 1: 'SAVINGS', 2: 'LOAN' }

    it(`1. HAPPY PATH -  Validate creating a new account and then logging in by id`, () => {

        /* OBJECTIVES: 
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

                // Idempotence check: ensure response data is stable and reliable across repeated API calls
                return getRequests.customerAccounts(CUSTOMER_ID).then(res1 => {
                    return getRequests.customerAccounts(CUSTOMER_ID).then(res2 => {
                        idempotenceStrict(res1, res2)
                        return postRequests.createAccount({ customerId: CUSTOMER_ID, newAccountType: 0, fromAccountId: travelKit.fromAccount.id }).then(create1 => {
                            return postRequests.createAccount({ customerId: CUSTOMER_ID, newAccountType: 1, fromAccountId: travelKit.fromAccount.id }).then(create2 => {
                                idempotenceLight(create1, create2)
                            })
                        })
                    })
                })
            })
    })





    it.only('2. HAPPY PATH - Update Transaction List after Bank Transfer', () => {
        /*
        OBJECTIVES
        1) Choose a sender (has funds) and a distinct recipient.
        2) Pick a safe transfer amount relative to sender balance.
        3) Snapshot both accounts’ transaction lists (BEFORE).
        4) Transfer funds via API.
        5) Snapshot again (AFTER) and assert:
           - sender’s list increased and contains the transfer,
           - recipient’s list increased and is consistent with sender,
           - transaction-by-id matches the sender’s record.
      */
        const travelKit = {}

        //GET: customer accounts (baseline state)
        return cy.getAccounts(CUSTOMER_ID).then(accountsList => {
            cy.pickSenderRecipient(accountsList).then(({ recipient, sender }) => {
                const amount = pickAmount(sender.balance)
                travelKit.sender = sender
                travelKit.recipient = recipient
                travelKit.amount = amount

            })
        })

            .then(() => {
                //GET: BEFORE (SENDER)
                return cy.transactionsOf(travelKit.sender.id).then(list => {
                    travelKit.senderListBefore = list
                    travelKit.senderBeforeCount = list.length
                })
            })

            .then(() => {

                //GET: BEFORE (recipient)
                return cy.transactionsOf(travelKit.recipient.id).then(list => {
                    travelKit.recipientListBefore = list
                    travelKit.recipientBeforeCount = list.length
                })
            })

            //ACT: transfer funds 
            .then(() => {
                return cy.transfer({
                    from: travelKit.sender.id,
                    to: travelKit.recipient.id,
                    amount: travelKit.amount
                }).then(resTransfer => {
                    travelKit.transferConfirm = resTransfer
                })
            })

            //GET: AFTER (Sender) + ASSERT (count increase and match by amount)
            .then(() => {
                return cy.transactionsOf(travelKit.sender.id).then(list => {
                    travelKit.senderListAfter = list
                    travelKit.senderAfterCount = list.length
                    const match = list.find(transaction => toNumber(transaction.amount) === toNumber(travelKit.amount))

                    //ASSERT That the number of transactions have increase. 
                    expect(match, `sender has transaction amount=${travelKit.amount}`).to.exist
                    expect(travelKit.senderAfterCount, 'sender transaction count has increased').to.be.greaterThan(travelKit.senderBeforeCount)

                    travelKit.accountMatchSender = { ...match, transactionId: match.id }
                })
            })

            //GET: After (recipient) + assert (Count + Consistency)
            .then(() => {
                return cy.transactionsOf(travelKit.recipient.id).then(list => {
                    travelKit.recipientListAfter = list
                    travelKit.recipientAfterCount = list.length

                    const match = list.find(transaction => toNumber(transaction.amount) === (travelKit.amount))
                    expect(match, `recipient has transaction amount=${travelKit.amount}`).to.exist
                    expect(travelKit.recipientAfterCount, 'recipient transaction count has increased')
                        .to.be.greaterThan(travelKit.recipientBeforeCount)

                    travelKit.accountMatchRecipient = { ...match, transactionId: match.id }
                    //ensure the two entrie are distinct records
                    if (travelKit.accountMatchRecipient?.id && match?.id) {
                        expect(match.id, 'distinct transaction ids').to.not.equal(travelKit.accountMatchSender.id)
                    }
                })
            })
            //ASSERT: sender transaction by id equals sender's found record 
            .then(() => {
                return cy.findTransactionById(travelKit.accountMatchSender.transactionId).then(byId => {
                    expect(Cypress._.omit(travelKit.accountMatchSender, ['transactionId'])).to.deep.eq(byId)
                })
            })
            //ASSERT: recipient transaction-by-id equals recipient's found record
            .then(() => {
                return cy.findTransactionById(travelKit.accountMatchRecipient.transactionId).then(byId => {
                    expect(Cypress._.omit(travelKit.accountMatchRecipient, ['transactionId'])).to.deep.eq(byId)
                })

                // Idempotence check: ensure response data is stable and reliable across repeated API calls
            })
            .then(() => {
                return getRequests.customerAccounts(CUSTOMER_ID).then(list1 => {
                    return getRequests.customerAccounts(CUSTOMER_ID).then(list2 => {
                        idempotenceStrict(list1, list2)
                    })
                        .then(() => {
                            return getRequests.transactionsList(travelKit.sender.id).then(transxn1 => {
                                return getRequests.transactionsList(travelKit.recipient.id).then(transxn2 => {
                                    idempotenceLight(transxn1, transxn2)
                                    return postRequests.transferFunds({ fromAccountId: travelKit.sender.id, toAccountId: travelKit.recipient.id, amount: 2 }).then(transfer1 => {
                                        return postRequests.transferFunds({ fromAccountId: travelKit.recipient.id, toAccountId: travelKit.sender.id, amount: 2 }).then(transfer2 => {
                                            idempotenceLight(transfer1, transfer2)
                                            return getRequests.transactionById(travelKit.accountMatchSender.transactionId).then(find1 => {
                                                return getRequests.transactionById(travelKit.accountMatchRecipient.transactionId).then(find2 => {
                                                    idempotenceLight(find1, find2)
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                })
            })
    })



    it('3. HAPPY PATH - Validate making a deposit', () => {

        /*
        OBJECTIVES
        1) Choose a customer account and a safe deposit amount.
        2) POST a deposit and validate the receipt.
        3) Verify the account’s transactions list updates and contains the deposit.
        */

        const travelKit = {}

        //GET: Pick an account and compute amount 
        return cy.getAccounts(CUSTOMER_ID).then(accounts => {
            travelKit.customer = pickCustomer(accounts)
            travelKit.amount = pickAmount(travelKit.customer.balance)

        })
            .then(() => {
                //GET: Snapshot BEFORE (for delta and matching)
                return cy.transactionsOf(travelKit.customer.id).then(before => {
                    travelKit.countBefore = before.length
                })
            })

            //ACT: Make the deposit
            .then(() => {
                return cy.postDeposit({
                    accountId: travelKit.customer.id,
                    amount: travelKit.amount
                }).then(receipt => {

                    //ASSERT: receipt is usable and mentions amount
                    //(postDeposit should already nromalize to string/object body )
                    travelKit.receiptText = typeof receipt === 'string' ? receipt : JSON.stringify(receipt)
                    expect(travelKit.receiptText, 'receipt mentions amount').to.include(String(travelKit.amount))
                })
            })
            //GET: snapshot AFTER + ASSERT (count and matching transactions exists)
            .then(() => {
                return cy.transactionsOf(travelKit.customer.id).then(after => {
                    travelKit.countAfter = after.length

                    //count increased 
                    expect(travelKit.countAfter, 'transactions count increased after deposit'
                    ).to.be.greaterThan(travelKit.countBefore)

                    //matchd by normalized amount 
                    const match = after.find(
                        transaction => toNumber(transaction.amount) === toNumber(travelKit.amount)
                    )
                    expect(match, `found deposit amount=${travelKit.amount}`).to.exist

                    expect(match).to.include.all.keys('id', 'amount')
                })

                // Idempotence check: ensure response data is stable and reliable across repeated API calls
            }).then(() => {
                return getRequests.customerAccounts(CUSTOMER_ID).then(list1 => {
                    return getRequests.customerAccounts(CUSTOMER_ID).then(list2 => {
                        idempotenceStrict(list1, list2)
                        const normList = normaliseResponse(list2)
                        cy.pickSenderRecipient(normList).then(({ recipient, sender }) => {
                            return getRequests.transactionsList(recipient.id).then(transList1 => {
                                return getRequests.transactionsList(sender.id).then(transList2 => {
                                    idempotenceLight(transList1, transList2)
                                    return postRequests.makeDeposit({ accountId: recipient.id, amount: 10 }).then(deposit1 => {
                                        return postRequests.makeDeposit({ accountId: sender.id, amount: 10 }).then(deposit2 => {
                                            idempotenceLight(deposit1, deposit2)
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })

    })

    it('4. HAPPY PATH - Validate making a 3rd party bill pay', () => {
        /*
        OBJECTIVES
        1. Pick a payer with sufficient balance. 
        2. POST bill pay; validate receipt 
        3. Transactions list increases and contains the payment. 
        4. transaction-by-id equals the found list entry
        */
        const travelKit = {
            payload: {
                name: 'Lidl Grocery Store',
                address: {
                    street: '124 Belhauser Strasse',
                    city: 'Berlin',
                    state: 'DE',
                    zipCode: '10783'
                },
                phoneNumber: '888-777-9999',
                accountNumber: 987987223
            }
        }

        //GET: fetch the account list
        //TRANSFORM: pick checking accoun with balance of > 500
        return cy.getAccounts(CUSTOMER_ID).then(accounts => {

            travelKit.payer = pickCustomer(accounts)
            travelKit.amount = pickAmount(travelKit.payer.balance)
        })

            .then(() => {
                //GET: BEFORE snapshot 
                return cy.transactionsOf(travelKit.payer.id).then(before => {
                    travelKit.beforeCount = before.length
                })
                    //ACT: POST bill pay -> assert receipt mentions amount 
                    .then(() => {

                        //ACT: Simulate billPay. 
                        return cy.postBillPay({
                            accountId: travelKit.payer.id,
                            amount: travelKit.amount,
                            payload: travelKit.payload
                        }).then(receipt => {
                            const text = (typeof receipt === 'string') ? receipt : JSON.stringify(receipt)
                            expect(text, 'receipt mentions amount').to.include(String(travelKit.amount))
                            travelKit.receipt = receipt
                            //update travelKit to include the receipt.  
                        })
                    })
                    .then(() => {

                        //GET: AFTER => ASSERT list grew and has matching transaction. 
                        return cy.transactionsOf(travelKit.payer.id).then(after => {
                            travelKit.afterCount = after.length
                            expect(travelKit.afterCount, 'transactions increased after bill pay')
                                .to.be.greaterThan(travelKit.beforeCount)

                            const match = after.find(transaction => toNumber(transaction.amount) === toNumber(travelKit.amount))
                            expect(match, `found billpay amount=${travelKit.amount}`).to.exist
                            travelKit.accountMatch = { ...match, transactionId: match.id }
                        })
                    })
                    //ASSERT: By-id equals found list entry 
                    .then(() => {
                        return cy.findTransactionById(travelKit.accountMatch.transactionId).then(byId => {

                            //ASSERT that the account match and the match found by transaction Id should deeply match. 
                            //we remove the added transaction property. 
                            expect(Cypress._.omit(travelKit.accountMatch, ['transactionId'])).to.deep.eq(byId)
                        })
                    })
                    .then(() => { // Idempotence check: ensure response data is stable and reliable across repeated API calls
                        return getRequests.customerAccounts(CUSTOMER_ID).then(list1 => {
                            return getRequests.customerAccounts(CUSTOMER_ID).then(list2 => {
                                idempotenceStrict(list1, list2)
                                const normList = normaliseResponse(list2)
                                cy.pickSenderRecipient(normList).then(({ recipient, sender }) => {
                                    return getRequests.transactionsList(recipient.id).then(tList1 => {
                                        return getRequests.transactionsList(sender.id).then(tList2 => {
                                            idempotenceLight(tList1, tList2)
                                            return postRequests.postBillPay({ payload: travelKit.payload, accountId: recipient.id, amount: 10 }).then(res1 => {
                                                return postRequests.postBillPay({ payload: travelKit.payload, accountId: sender.id, amount: 10 }).then(res2 => {
                                                    idempotenceLight(res1, res2)
                                                })
                                            })

                                        })
                                    })
                                })
                            })
                        })

                    })

            })
    })

    it('5. HAPPY PATH - Validates making a withdraw', () => {
        const travelKit = {}
        /*
        OBJECTIVES:
        1) Verify that a customer with sufficient funds can make a withdrawal via API.
        2) Confirm that the withdrawal request returns a receipt containing the withdrawn amount.
        3) Ensure that the customer’s transaction list grows after the withdrawal.
        4) Validate that the transaction list includes a matching entry for the withdrawal.
        */

        //GET: pick account and amount
        return cy.getAccounts(CUSTOMER_ID).then(accounts => {
            travelKit.customer = pickCustomer(accounts)
            travelKit.amount = pickAmount(travelKit.customer.balance)
        })

            //GET: BEFORE snapshot 
            .then(() => cy.transactionsOf(travelKit.customer.id).then(before => {
                travelKit.beforeCount = before.length
            }))

            //ACT: withdraw -> assert receipt mentions amount 
            .then(() => {
                return cy.makeWithdraw({ accountId: travelKit.customer.id, amount: travelKit.amount }).then(receipt => {
                    const text = typeof receipt === 'string' ? receipt : JSON.stringify(receipt)
                    expect(text, `withdraw receipt mentions amount`).to.include(travelKit.amount)
                    travelKit.receipt = text
                })
            })
            //GET: AFTER -> ASSERT count increase and has matching negative/outgoing 
            .then(() => {
                return cy.transactionsOf(travelKit.customer.id).then(after => {
                    travelKit.afterCount = after.length
                    expect(travelKit.afterCount, 'transactions increased after withdraw').to.be.greaterThan(travelKit.beforeCount)

                    const match = after.find(transaction => toNumber(transaction.amount) === toNumber(travelKit.amount))
                    travelKit.matchTransaction = match
                })
            }).then(() => {
                // Idempotence check: ensure response data is stable and reliable across repeated API calls
                return getRequests.customerAccounts(CUSTOMER_ID).then(list1 => {
                    return getRequests.customerAccounts(CUSTOMER_ID).then(list2 => {
                        idempotenceStrict(list1, list2)
                        const normList = normaliseResponse(list2)
                        cy.pickSenderRecipient(normList).then(({ recipient, sender }) => {
                            return getRequests.transactionsList(sender.id).then(tran1 => {
                                return getRequests.transactionsList(recipient.id).then(tran2 => {
                                    idempotenceLight(tran1, tran2)
                                    return postRequests.postWithdraw(sender.id).then(withdraw1 => {
                                        return postRequests.postWithdraw(recipient.id).then(withdraw2 => {
                                            idempotenceStrict(withdraw1, withdraw2)
                                        })
                                    })
                                })
                            })
                        })
                    })
                })

            })
    })



    it('6. NEGATIVE PATH - Fetching customer list with invalid account ID', () => {

        /*
        OBJECTIVES: 
        1. Attempt to fetch customer accounts with an invalid account ID.
        2. API responds with 400 (client error).
        3. Error status is documented with clear reason ("server wouldn’t process request").
        */

        return getRequests.customerAccounts(INVALID_ACCOUNT).then(resInv => {
            expect([400], 'the server wouldnt process the request because of client error').to.include(resInv.status)
        })
    })

    it('7. NEGATIVE PATH - Creating an account with an invalid accountType', () => {

        /*
        OBJECTIVES:
        1. Overall, validate that the system rejects unsupported account types. 
        2. Fetch valid customer accounts to use as the "fromAccountId".
        3. Attempt to create a new account with an invalid accountType (5).
        4. API responds with 500 (server-side error).
        */

        return cy.getAccounts(CUSTOMER_ID).then(list => {
            const account = pickCustomer(list)
            return postRequests.createAccount({
                customerId: CUSTOMER_ID,
                newAccountType: 5, //invalid accountTYpe
                fromAccountId: account.id
            }).then(resCreate => {
                expect([500], 'internal error').to.include(resCreate.status)
            })
        })

    })



    it('8. NEGATIVE PATH - Fetching Account details with an invalid Id', () => {
        /*
        OBJECTIVES:
        1. Ensure system does not expose or process invalid account IDs.
        2. Attempt to fetch account details using an invalid account ID.
        3. API responds with 400 (bad request / client error).
        */
        return getRequests.accountByAccountId(INVALID_ACCOUNT).then(account => {
            expect([400]).to.include(account.status)
        })
    })


    it.skip('9. NEGATIVE PATH - Transfer exceeds balance (overdraft permitted)', () => {
        
        /*
        OBJECTIVES: 
        1. Attempt to transfer an amount greater than the sender’s balance.  
        2. Verify system behavior when overdraft is requested.  
        3. Confirm whether balances/transactions are incorrectly updated or rejected.  
        4. Highlight as a spec gap: sandbox API currently allows overdrafts against expected business rules.  
        NOTE: Skipped because the website occassionally permits overdraft, which should go against business rules.
        */

        const travelKit = {}
        return cy.getAccounts(CUSTOMER_ID).then(list => {
            //SETUP: pick a sender with the lowest balance and a different recipient account.  
            const sortedByBal = [...list].sort((a, b) => toNumber(a.balance) - toNumber(b.balance))
            travelKit.sender = sortedByBal[0]
            travelKit.recipient = sortedByBal.find(a => a.id !== travelKit.sender.id) || sortedByBal[1]
            //TRANSFORM: calculate transfer amount larger than sender’s balance.  
            travelKit.amount = Math.max(1, toNumber(travelKit.sender.balance) + 5)
        })
            .then(() => {
                return cy.getAccounts(CUSTOMER_ID).then(list => {
                    travelKit.senderBefore = toNumber(list.find(a => a.id === travelKit.sender.id).balance)
                    travelKit.recipientBefore = toNumber(list.find(a => a.id === travelKit.recipient.id).balance)

                })
                    .then(() => {
                        //ACT: attempt transfer request with insufficient funds.
                        return postRequests.transferFunds({
                            from: travelKit.sender.id,
                            to: travelKit.recipient.id,
                            amount: travelKit.amount
                        }).then(() => {
                            cy.getAccounts(CUSTOMER_ID).then(after => {
                                const senderAfter = toNumber(after.find(a => a.id === travelKit.sender.id).balance)
                                const recipientAfter = toNumber(after.find(a => a.id === travelKit.recipient.id).balance)
                                //ASSERT: verify post-transfer balances reflect overdraft (sender negative, recipient credited).  

                                expect(senderAfter).to.eq(travelKit.senderBefore - travelKit.amount)
                                expect(recipientAfter).to.eq(travelKit.recipientBefore + travelKit.amount)
                            })
                        })
                    })
            })
    })


    it('10. NEGATIVE PATH - Making a deposit with an invalid account ID', () => {

        /*
        OBJECTIVES: 
        1. Attempt to deposit into a non-existent account.  
        2. Verify system behavior when invalid account IDs are used.  
        3. Confirm error response is returned and funds are not applied.  
        4. Highlight resilience against invalid deposit requests.  
        */

        //ACT: send deposit request to API with an invalid accountId. 
        return postRequests.makeDeposit({ accountId: CUSTOMER_ID, amount: 100 }).then(res => { //ACT: send deposit request to API with an invalid accountId. 
            //ASSERT: response status is 400 (bad request). 
            expect([400]).to.include(res.status)

            //ASSERT: error body clearly states account number not found.  
            expect(res.body).to.contain(`Could not find account number ${CUSTOMER_ID}`)
        })
    })

    it('11. NEGATIVE PATH - Making withdraw with an invalid account ID', () => {

        /*
        OBJECTIVES:
        1. Attempt to withdraw from a non-existent account.  
        2. Verify system behavior when invalid account IDs are used.  
        3. Confirm error response is returned and balances remain unchanged.  
        4. Highlight resilience against invalid withdrawal requests.
        */

        return postRequests.postWithdraw({ accountId: CUSTOMER_ID, amount: 10 }).then(withdraw => {
            //ASSERT: response status is 400 (client error).
            expect([400]).to.include(withdraw.status)
            //ASSERT: response body explicitly states that the account number was not found.  
            expect(withdraw.body).to.contain(`Could not find account number ${CUSTOMER_ID}`)
        })
    })


})






