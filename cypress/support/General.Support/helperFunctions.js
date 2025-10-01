console.log('[API.helpers] loaded');

export const assertAcctsSample = (arr, n = 5) => {
    const sample = Cypress._.sampleSize(arr, Math.min(n, arr.length))
    sample.forEach((a, i) => {
        const ok = a && typeof a === 'object' && 'id' in a && 'customerId' in a && 'type' in a && 'balance' in a
        expect(ok, `account sample ${a.id} has the correct shape`).to.eq(true)
    })
    return arr
}

export const assertPositionsList = (arr) => {
    arr.forEach((p, i) => {
        const ok = p && typeof p === 'object' && 'customerId' in p && 'positionId' in p && 'name' in p && 'symbol' in p && 'shares' in p && 'purchasePrice' in p
        expect(ok, `position sample ${p.positionId} has the correct shape`).to.eq.true
    })
}

export const assertTxnsSample = (arr, n = 5) => {
    const sample = Cypress._.sampleSize(arr, Math.min(n, arr.length))
    sample.forEach((t, i) => {
        const ok = t && typeof t === 'object' && 'id' in t && 'amount' in t && 'date' in t
        expect(ok, `transaction sample ${t.id} has the correct shape`).to.eq(true)
    })
    return arr
}

export const calculateDownPayment = (amount) => {
    const downPayment = Math.round(amount * 0.20)
    //   console.log('downpayment', downPayment)
    return downPayment
}

export const determinePricePerShare = (purchasePrice, shares) => {
    return Math.max(1, Math.round(toNumber(purchasePrice) / Math.max(1, toNumber(shares))))
}

export const expectOk = (res, codes = [200, 204]) => {
    expect(codes, `expected ${codes.join('/')} got ${res.status}`).to.include(res.status)
    return res
}

export const formatAndSchema = (res, { expectArray } = {}) => {
    const headers = res.headers || {}
    // console.log('headers', headers)
    const ct = String(headers['content-type'] || headers['Content-Type'] || '').toLowerCase() //returns the content-type as a string and ensure its in lowercase e.g., ct:application/json
    //   console.log('ct', ct)
    const body = res.body
    //   console.log('body:', body)
    //  console.log('typeof', typeof body)
    const isJsonCT = ct.includes('json') //does the content header include 'json'
    const isArray = Array.isArray(body)
    const isObject = body && typeof body === 'object' && !Array.isArray(body) //if the object is not an array
    //    console.log('ct:', ct, '/body:', body, '/isJSONCT:', isJsonCT, 'isArray', isArray, 'isObject', isObject)

    //Treat as JSON only if header says json and body is actually array or object
    if ((isJsonCT && (isArray || isObject))) {
        if (expectArray === true) {
            expect(isArray, 'body should be an array').to.eq(true)
        } else if (expectArray === false) {
            expect(isObject, 'body should be an object').to.eq(true)
        } else {
            expect(isArray || isObject, 'body should be an array or object').to.eq.apply(true)
        }
        return res
    }

    //Otherwise treat it as text (covers text/plain, text/html )
    const text = typeof body === 'string' ? body : JSON.stringify(body)
    const looksLikeHTML = /<.+?>[\s\S]*<\/.+?>/m.test(text)
    //  console.log('looksLikeHTML', looksLikeHTML)

    if (looksLikeHTML) {
        expect(text).to.match(/<.+?>[\s\S]*<\/.+?>/m)
    } else {
        expect(text).to.match(/(success|transferred|completed|ok)/i)
    }
    return res
}

export const getPositionAccount = (positionsList) => {
    return positionsList.find(position => toNumber(position.shares) > 5) || positionsList[0]
}

export const getPositionSeller = (accounts) => {
    const seller = accounts.find(account => toNumber(account.shares) > 20) || accounts[0]
    return seller
}

export const idempotenceLight = (res1, res2) => {
    //helpful for POST or when the response body is different. 
    const ct1 = (res1.headers['content-type'] || '').toLowerCase()
    const ct2 = (res2.headers['content-type'] || '').toLowerCase()

    expect([200, 201, 400, 403, 409, 422, 500]).to.include(res1.status)
    expect([200, 201, 400, 403, 409, 422, 500]).to.include(res2.status)
    expect(ct2).to.eq(ct1)
}

export const idempotenceStrict = (res1, res2) => {
    expect(res1.status).to.eq(res2.status) //match statuses
    const ct1 = (res1.headers['content-type'] || '').toLowerCase() //tells us the data format (e.g., JSON)
    const ct2 = (res2.headers['content-type'] || '').toLowerCase()
    expect(ct2).to.eq(ct1)

    if (/json/.test(ct1)) {
        expect(res2.body).to.deep.equal(res1.body) //we will compare the structures of the JSON objects directly 
    } else {
        /* the res.bodies could be in XML or plain text format. Therefore, we will use it as if its already in string format. 
        otherwise we will convert into a string. 
        */
        const b1 = typeof res1.body === 'string' ? res1.body : JSON.stringify(res1.body)
        const b2 = typeof res2.body === 'string' ? res2.body : JSON.stringify(res2.body)
        expect(b2.trim()).to.eq(b1.trim())
    }
}

export const mustHave = (o, keys) => keys.forEach(k => expect(o, `missing ${k}`).to.have.property(k))

export const negotiateShares = (shares) => {
    return Math.min(sharesOr1(shares), Math.max(1, Math.floor(toNumber(shares) / 2)))
}
export const normaliseResponse = (res) => {
    if (Array.isArray(res?.body)) {
        console.log("Matched: res.body is an array");
        return res.body;
    }
    if (Array.isArray(res)) {
        console.log("Matched: res is an array");
        return res;
    }
    if (typeof res === "string") {
        console.log("Matched: res is a string");
        return res;
    }
    if (res && typeof res === "object") {
        console.log("Matched: res is an object");
        return res.body ?? res ?? res[0] ?? [];
    }
    console.log("Matched: default fallback");
    return [];
};

export const pickAmount = (balance) => Math.max(1, Math.floor(toNumber(balance) * 0.20))

export const pickCustomer = (accounts) => {
    const eligible = accounts.find(account => String(account.type).toUpperCase() === 'CHECKING' && toNumber(account.balance) > 99)
    return eligible || accounts[0]
}

export const pickTwoAccounts = (accounts) => {
    const sender = accounts.find(a => toNumber(a.balance) > 0 || accounts[0])
    const recipient = accounts.find(a => a.d !== sender.id) || accounts[1]
    return { sender, recipient }
}

export const sharesOr1 = (x) => {
    return Math.max(1, Math.floor(toNumber(x)))
}

export const toNumber = (num) => Number(String(num).replace(/[^0-9.-]/g, ''))





