export class UIMethods {

    clickThrough(links) {
        /*
          Objectives:
          1) From each internal page, navigate to every other internal target via its link.
          2) Assert path after click, then back/forward both restore expected routes.
        */
        const internals = links.filter(l => l.linkStatus === 'internal')
        const pairs = []
        for (let i = 0; i < internals.length; i++) {
            for (let j = i + 1; j < internals.length; j++) {
                pairs.push({ from: internals[i], to: internals[j] })
            }
        }
        const norm = (p) => (p && p.endsWith('/') ? p.slice(0, -1) : p)

        cy.wrap(pairs).each(({ from, to }) => {
            // GET: from-page
            cy.visit(from.path)
            cy.location('pathname').should((p) => expect(norm(p)).to.include(norm(from.path)))
            cy.get('#bodyPanel').should('be.visible')

            // ACT: click link to to-page
            cy.get(to.selector).should('exist').and('be.visible').click()

            // ASSERT: now on to-page
            cy.location('pathname').should((p) => expect(norm(p)).to.include(norm(to.path)))

            // RESET: back → assert from-page
            cy.go('back')
            cy.location('pathname').should((p) => expect(norm(p)).to.include(norm(from.path)))

            // ACT: forward → assert to-page again
            cy.go('forward')
            cy.location('pathname').should((p) => expect(norm(p)).to.include(norm(to.path)))
        })
    }


    validateInput(input, { optionText } = []) {
        /*
        Objectives: 
        1. Radio/Element: clement is visible, can be checked and its label text matches. 
        2. Dropdown: select by value (or visible text), and the selection persists, dropdown has options. 
       */

        cy.wrap(input).each((field) => {
            const {      //destructure each field object. 
                selector,
                label,
                type,
                value
            } = field

            //1. ensure target exists and visible; alias for reuse. 
            cy.get(selector).should('exist').and('be.visible').as('field')

            if (type === 'radio' || type === 'checkbox') {
                //ACT: check the control (force avoids overlay issue)
                cy.get('@field').check({ force: true }).should('be.checked')


                cy.get('@field')
                    .parent()
                    .invoke('text')
                    .then(text => {
                        const normalized = text.replace(/\s+/g, '').trim()
                        expect(normalized, 'normalized label').to.contain(String(label).replace(/\s+/g, ''))
                    })
            }
            else if (type === 'dropdown') {
                //ACT: choose selection by value if provided; else by option text if provided. 
                if (value !== null && value !== '') {
                    cy.get('@field').select(String(value)).should('have.value', String(value))
                    cy.log(`[validateInput] dropdown selected by ${value}`)

                } else if (field.optionText || optionText) {
                    const textToPick = field.optionText || optionText
                    cy.get('@field').select(textToPick)
                    cy.get('@field').find('option:selected').should('have.text', textToPick)
                    cy.log(`[validateInput] selected by text: ${textToPick}`)
                } else {
                    cy.log(`[validateInput] no value/optionText provided; skipping select`)
                }
                //ASSERT: dropdown has > 0 options 
                cy.get('@field').find('Option').its('length').should('be.gt', 0)
            }
            else {
                cy.log(`[validateInput] unsupported type: ${type}`)
            }
        })
    }

    validateLinks(links, { matchURLs = false } = {}) {

        /*
        Objectives:
        1) Link is visible and labeled correctly.
        2) External links: href responds 2xx–3xx; target=_blank honored (if specified).
        3) Internal links: clicking navigates to expected route; optional title/heading checks.
      */



        const norm = (p) => String(p || '')
            .replace(/;jsessionid=[^/]+/i, '') // strip matrix param ParaBank sometimes adds
            .replace(/\/+$/, '');              // strip trailing slash

        const basePath = norm(new URL(Cypress.config('baseUrl')).pathname); // e.g. "/parabank"

        cy.wrap(links).each((link, index) => {
            const {
                selector,
                label,
                destination,
                linkStatus,
                newTab,
                expectedTitle,
                expectedHeading,
            } = link;

            cy.log(`[#${index}] testing link: ${label} (${selector})`);
            cy.then(() => console.log('link config:', link, 'index:', index));

            // verify that the link exists and is labeled correctly
            cy.get(selector)
                .should('be.visible')
                .and('contain.text', label)
                .then(() => cy.log(`${label} is visible and labelled correctly`));
            // e.g., testing link: About Us (ul.leftmenu a[href*="about.htm"])

            // External links
            if (linkStatus === 'external') {
                cy.get(selector).then($a => {
                    cy.log('[outerHTML]', $a[0]?.outerHTML || '');
                    cy.log('[href/target]', $a.attr('href') || '', $a.attr('target') || '');
                });

                if (typeof newTab === 'boolean') {
                    cy.get(selector)
                        .should(newTab ? 'have.attr' : 'not.have.attr', 'target', '_blank')
                        .then($a => {
                            console.log('[debug external attrs]', {
                                href: $a.attr('href'),
                                target: $a.attr('target')
                            });
                        });
                }

                cy.get(selector)
                    .invoke('attr', 'href')
                    .then(href => {
                        cy.log(`External Link href: ${href}`);
                        return cy.request({ url: href, followRedirect: true });
                    })
                    .its('status')
                    .should('be.within', 200, 399)
                    .then(status => cy.log(`external link responded with status ${status}`));

                return; // 🔑 stop here for external links
            }

            // Internal links — force same-tab, then click
            cy.get(selector).invoke('removeAttr', 'target').click();

            // Match URL/path if requested
            if (matchURLs && destination) {
                // Cope with "/parabank" base + trailing slashes + ;jsessionid
                const destNorm = norm('/' + String(destination).replace(/^\/+/, '')); // "/about.htm"
                cy.location({ timeout: 15000 }).should((loc) => {
                    const path = norm(loc.pathname);                 // e.g. "/parabank/about.htm"
                    const expectedFull = norm(basePath + destNorm);  // "/parabank/about.htm"
                    const ok = path === expectedFull || path.endsWith(destNorm);
                    expect(
                        ok,
                        `pathname "${path}" should equal "${expectedFull}" or end with "${destNorm}"`
                    ).to.eq(true);
                });
            }

            cy.log(`Navigated to ${destination || '(no destination provided)'}`);

            // Title check
            if (expectedTitle) {
                cy.title().then(title => {
                    cy.log(`Page Title: ${title}`);
                    expect(title).to.contain(expectedTitle);
                });
            }

            // Heading check
            if (expectedHeading) {
                cy.contains('h1, h2, h4, .heading', expectedHeading)
                    .should('be.visible')
                    .then(() => cy.log(`Found Heading: ${expectedHeading}`));
            }
        });
    }


    validatePageLogo(pages) {

        /*
        OBJECTIVES:
        1) From each internal page, the logo is visible and same-tab.
        2) Clicking the logo navigates to the home path.
        3) A unique home marker is visible (content assertion).
        */

        // normalize paths that may include ;jsessionid and trailing slashes
        const normaliseURL = s => 
            String(s || '')
            .replace(/;jsessionid=[^/?#]+/i, '') // strip session token injected by server
            .replace(/\/+$/, '');  // strip trailing slashes for stable comparisons
        


        const logoImg = '#topPanel img.logo' // target the IMG...
        const expectedPath = '/index.htm' // ...but click its wrapping <a>
        

        cy.wrap(pages).each(({ name, path }) => {
            cy.log(`Origin: ${name} (${path})`)

            //GET: visit origin page 
            cy.visit(path)

            // ASSERT: Ensure the logo image is visible, then climb to the wrapping anchor and click it.
            cy.get(logoImg)
                .should('be.visible')
                .parents('a')   //move up from <img> to the wrapping <a>
                .first()
                .then($a => {
                    cy.wrap($a).click({ force: true })
                })

            // ASSERT: We landed on Home — tolerate jsessionid by normalizing the pathname
            cy.location('pathname', { timeout: 15000 }).should( path => {
                const normalisedPath = normaliseURL(path)
                const ok = normalisedPath.endsWith(expectedPath) || normalisedPath === normaliseURL(expectedPath)
                expect(ok, `pathname "${normalisedPath}" should end with "${expectedPath}"`).to.eq(true)
            })

            cy.contains(/ATM Services/i, {timeout: 10000}).should('be.visible')
            cy.log(`Logo from ${name} returned to Homepage`)


        })

    }



}

export const userInteraction = new UIMethods()