import { getRequests } from "../../support/API.support.utils/getRequests"
import { postRequests } from "../../support/API.support.utils/postRequests"
import { getPositionAccount, negotiateShares, determinePricePerShare, pickCustomer, toNumber, idempotenceStrict, normaliseResponse, idempotenceLight } from "../../support/General.Support/helperFunctions"

describe('Position centric operations', () => {
    const CUSTOMER_ID = 12212



    it('1. HAPPY PATH - Validates selling positions via API', () => {

        /*
        OBJECTIVES:
        1. Validate that a customer can successfully sell an existing position.  
        2. Confirm shares decrease after the sale and proceeds are routed to an account.  
        3. Ensure position details remain accurate when re-fetched by ID.  
        4. Verify response data is consistent across repeated API calls (idempotence check).  
        */

        const travelKit = {}
        //GET: positions -> Pick a seller 
        return postRequests.initializeDatabase().then(res => {
            expect([200, 204]).to.include(res.status)
            cy.log('Database has been initialized')
        })
            .then(() => {
                return cy.getCustomerPositions(CUSTOMER_ID).then(positions => {

                    const seller = getPositionAccount(positions)
                    const sharesToSell = negotiateShares(positions.shares)
                    const pricePerShare = determinePricePerShare(positions.purchasePrice, positions.shares)

                    travelKit.positions = positions
                    travelKit.seller = seller
                    travelKit.sellPayload = {
                        positionId: seller.positionId,
                        shares: sharesToSell,
                        pricePerShare
                        //account id will be filled from money account below 
                    }
                    cy.log(`seller ${seller.positionId} has ${seller.shares} shares; will sell ${sharesToSell} @ ${pricePerShare}`)
                })
                    //GET: accounts -> pick a money account for proceeds 
                    .then(() => {
                        return cy.getAccounts(CUSTOMER_ID).then(accounts => {
                            const money = pickCustomer(accounts)
                            travelKit.moneyAccount = money
                            travelKit.sellPayload = {
                                ...travelKit.sellPayload,
                                accountId: money.id
                            }
                        
                        })

                            //ACT: sell position 
                            .then(() => {
                                return cy.sellingPosition({
                                    customerId: CUSTOMER_ID,
                                    accountDetails: travelKit.sellPayload
                                }).then(list => {
                                    //API returns positions array after sale 

                                    const sale = list.find(position => position.positionId === travelKit.sellPayload.positionId)
                                    expect(sale, 'sale result present for position').to.exist
                                    travelKit.sale = sale

                                    //ASSERT: shares decreased (if any were sold)
                                    if (toNumber(travelKit.sellPayload.shares) > 0) {
                                        expect(toNumber(travelKit.seller.shares), 'shares decreased').to.be.greaterThan(toNumber(sale.shares))
                                    }

                                })

                                //Optional: GET by id and confirm post-sale state 
                            }).then(() => {
                                cy.getPositionById(travelKit.sellPayload.positionId).then(byId => {
                                    expect(byId.positionId).to.eq(travelKit.sale.positionId)
                                    expect(toNumber(byId.shares)).to.eq(toNumber(travelKit.sale.shares))
                                })
                            })
                    })
                    .then(() => {

                        // Idempotence check: ensure response data is stable and reliable across repeated API calls
                        return getRequests.customerPositions(CUSTOMER_ID).then(pos1 => {
                            return getRequests.customerPositions(CUSTOMER_ID).then(pos2 => {
                                idempotenceStrict(pos1, pos2)
                                return getRequests.customerAccounts(CUSTOMER_ID).then(acc1 => {
                                    return getRequests.customerAccounts(CUSTOMER_ID).then(acc2 => {
                                        idempotenceStrict(acc1, acc2)
                                        const normAccounts = normaliseResponse(acc2)
                                        cy.pickSenderRecipient(normAccounts).then(({ sender, recipient }) => {
                                            const payA = { ...travelKit.sellPayload, accountId: sender.id }
                                            return postRequests.sellPosition({ customerId: CUSTOMER_ID, accountDetails: payA }).then(sell1 => {
                                                const payB = { ...travelKit.sellPayload, accountId: recipient.id }
                                                return postRequests.sellPosition({ customerId: CUSTOMER_ID, accountDetails: payB }).then(sell2 => {
                                                    idempotenceLight(sell1, sell2)
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


    it('HAPPY PATH - Validates buying a position via API', () => {
        /*
          OBJECTIVES:
          1. Verify that a customer can buy a new position via API.
          2. Ensure the purchase response includes a distinct `positionId`.
          3. Confirm that the positions list increases in length after purchase.
          4. Confirm the new position can be retrieved directly by its id.
          NOTE: The demo API does not update account balances or debit transactions reliably for buys.
                This test focuses on contract validation and list growth, not on account-side effects.
        */

        // GET: Reset database → prevent flakiness in positionsList API
        return postRequests.initializeDatabase().then((init) => {
            expect([200, 204]).to.include(init.status)
            cy.log('Database has been initialized')
        })
            .then(() => {
                const travelKit = {}

                // GET: Fetch baseline positions list
                // TRANSFORM: Pick a buyer (position to replicate)
                return cy.getCustomerPositions(CUSTOMER_ID).then(posList => {
                    travelKit.posListBefore = posList.length
                    const buyer = pickCustomer(posList)
                    return cy.wrap(buyer)
                })
                    .then((buyer) => {
                        // GET: Fetch accounts list → need a funding accountId
                        return cy.getAccounts(CUSTOMER_ID).then(accts => {
                            const pricePerShare = Math.round(toNumber(buyer.purchasePrice / toNumber(buyer.shares)))
                            const shares = Math.round(toNumber(buyer.shares) / 5)
                            const moneyId = pickCustomer(accts).id

                            // TRANSFORM: Build payload (omit customerId)
                            const payload = { ...buyer, accountId: moneyId, pricePerShare, shares }
                            travelKit.payload = { ...Cypress._.omit(payload, ['customerId']) }
                        })
                    })
                    .then(() => {
                        // ACT: Execute purchase
                        return cy.buyingPosition({ customerId: CUSTOMER_ID, accountDetails: travelKit.payload }).then(res => {
                            travelKit.posPurchases = res

                            // TRANSFORM: Identify the newly purchased position in response
                            travelKit.foundPos = travelKit.posPurchases.find(
                                purchase => toNumber(purchase.shares) === travelKit.payload.shares &&
                                    purchase.name === travelKit.payload.name
                            )

                            // ASSERT: New positionId is distinct from the original
                            expect(
                                travelKit.foundPos.positionId,
                                'the new position should have a distinct positionId'
                            ).to.not.eq(travelKit.payload.positionId)
                        })
                    })
                    .then(() => {
                        // GET: Refetch positions list
                        return cy.getCustomerPositions(CUSTOMER_ID).then(posList => {
                            travelKit.posListAfter = posList.length

                            // ASSERT: Positions list has grown
                            expect(
                                travelKit.posListAfter,
                                'another position account has been added to the position list'
                            ).to.be.greaterThan(travelKit.posListBefore)
                        })
                    })
                    .then(() => {
                        // GET: Retrieve by new positionId
                        return cy.getPositionById(travelKit.foundPos.positionId).then(byId => {
                            // ASSERT: Direct fetch matches response
                            expect(travelKit.foundPos).to.deep.eq(byId)
                        })
                    })
            })
    })


})



