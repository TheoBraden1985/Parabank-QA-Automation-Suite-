import { footerMenuLinks } from "../../fixtures/URL.data/footerLinks.data";
import { mainMenuPages } from "../../fixtures/URL.data/mainMenuLinks.data";
import { topNavLinks } from "../../fixtures/URL.data/topNavLinks.data";
import { internalPages } from "../../fixtures/URL.data/pageLinks.data";
import { userInteraction } from "../../support/UI.Support/InteractiveMethods";

/*
OBJECTIVES: 
1) Each menu (top, main, footer) navigates correctly in the same tab.
2) The brand logo returns to Home from representative internal pages.
3) Invalid routes return a 404 (and no accidental app shell).
4) Back/forward history restores expected pages across all menus.
*/


describe('Interact with page elements', () => {
  beforeEach(() => {
    // cy.ensureLoggedIn();
  });

  const menus = [
    { name: 'TOP NAV MENU', data: topNavLinks },
    { name: 'MAIN MENU', data: mainMenuPages },
    { name: 'FOOTER MENU', data: footerMenuLinks }
  ]

  menus.forEach(({ name, data }, i) => {
    it(`${i * 2 + 1}. HAPPY PATH - Validates routing to the correct URL from ${name}`, () => {
      cy.visit('/')
      userInteraction.validateLinks(data, { matchURLs: true })
    })
    it(`${i * 2 + 2}. HAPPY PATH - Validates backwards and forwards across ${name}`, () => {
      cy.visit('/')
      userInteraction.clickThrough(data)
    })
  })



  it('7. HAPPY PATH - Logo returns to Home from multiple pages', () => {

    /* OBJECTIVES:
    1. From every internal page (except the homepage), clicking the logo should route the user back to the homepage.
    2. Verify the logo link is visible, same-tab (not target="_blank"), and points to index.htm.
    3. Confirm navigation by checking the URL and unique homepage marker (e.g., "ATM Services").
    */

    const origins = internalPages.filter(p => !/index\.htm$/.test(p.path)) //filters out the index page
    userInteraction.validatePageLogo(origins)
  })


  it('8. NEGATIVE PATH - Invalid URL Path returns 404 (double base segment)', () => {

    /* OBJECTIVES:
    1. Ensure that invalid URL paths (extra/double base segments) return HTTP 404.
    2. Validate both the response status code and body message for consistency.
    3. Provide resilience against response type differences (string vs. object).
    */

    const doubleBaseBadURL = '/parabank/customers' //https://parabank.parasoft.com/parabank/parabank/customers
    const doubleBaseBadURL2 = '/parabank/customers.htm' //https://parabank.parasoft.com/parabank/parabank/customers.htm

    cy.request({ url: doubleBaseBadURL, failOnStatusCode: false }).then(res => {
      expect(res.status).to.eq(404)
      expect(res.body).to.match(/(not found | http status | error)/i)
      cy.log(`✔ bad relative URL(${doubleBaseBadURL})returned 404 as expected`)
    })

    cy.request({ url: doubleBaseBadURL2, failOnStatusCode: false }).then(res2 => {
      expect(res2.status).to.eq(404)
      cy.log(`✔ bad relative URL(${doubleBaseBadURL2})returned 404 as expected`)

      if (typeof res2.body === 'object') {
        expect(res2.body).to.have.property('title').match(/not found/i)
        expect(res2.body).to.have.property('detail').match(/no endpoint/i)
      } else {
        expect(res2.body).to.match(/(not found | http status | error)/i)
      }

    })
    cy.log(`✔404 for ${doubleBaseBadURL2}`)

  })


  it.skip('9. HAPPY PATH -  Active state from main menu reflects current page', () => {

    /* 
    OBJECTIVES:
    1. Verify that the "active state" in the main menu correctly reflects the currently loaded page.
    2. Check that the active state is exposed either via CSS class (active) or aria-current="page".
    3. Note: This test is skipped due to known site limitations (ParaBank menu does not always reflect active state).
    */

    const internalPages = (mainMenuPages).filter(page => page.linkStatus == 'internal')
    confirmPageActiveState(internalPages)
  })


})











