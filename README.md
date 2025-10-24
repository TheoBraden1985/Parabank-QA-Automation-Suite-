# Parabank-QA-Automation-Suite-
This. repository contains a full end-to-end test suite for the Parabank Demo Banking Application (https://parasoft.parasoft.com). It demonstrates API and UI automation coverage across critical workflows, accessibility, and error handling. The suite was built with Cypress, following QA best practices like idempotence check, boundary conditions, and negative path testing.

Whats Covered:

## 🔗 API Tests
-**Account Operations**: deposits, withdrawals, transfers, bill pay 
-**Customer Operations**: login, profile update, account creation  
-**Loan Operations**: request and validation (happy + negative paths) 
-**Position Operations**: buying/selling positions with idempotence checks 
-**Negative Testing**: invalid IDs, invalid account types, overdraft attempts

## 📱 UI Tests 
--**Accessibility**: Tab/Enter navigation, focus rings, label presence
--**Navigation**: main menu, footer, top nav, logo behavior 
--**Forms**: login, registration, contact form validation 
--**Responsiveness**: viewport smoke tests across mobile, tablet, and desktop 
--**Visual**: logo integrity, unique Ids on form fields

## 🔄 User Flows 
--**Registration Flow**: happy + missing fields + mismatches
--**Login Flow**: happy + empty/missing fields 
--**Contact Form**: happy + missing field + invalid email 

## 🎯 Example Test Objectives 
Every test is annotated with clear objectives. For example: 

	/* OBJECTIVES 
	1. Ensure all top navigation links are reachable via TAB key navigation.
	2. Verify pressing TAB moves focus sequentially across the menu.
	3. Confirm focused elements are visible and interactable.
	*/

## 🐛 Bugs Discovered
While building the suite, i discovered several defects in the Parabank app, including: 
-Overdrafts permitted via API transfer (violates business rules) 
-Invalid emails accepted on the contact form 
-Active state missing in menus (accessibility issue) 
-Account details not updating after buying positions.
-Successfully updating custoomer information via API with an invalid CustomerID and a missing username. 

## ⚙️ Tech Stack 
-Cypress 12+ (API + UI Automation) 
-Mocha/Chai (BDD assertions) 
-Custom Cypress Commands for DRY and reusable flows 

## 🚀 Getting Started
1. Clone the repo and install dependencies
   ```bash
   git clone https://github.com/TheoBraden1985/Parabank-QA-Automation-Suite-.git
   cd Parabank-QA-Automation-Suite-
   npm install
   ```
2. Run the test suite in interactive mode:
   ```bash
   npx cypress open
   ```
3. Or run all tests headlessly:
   ```bash
   npx cypress run
   ```
   
## 📂 Project Structure 
```markdown
cypress/
  e2e/
    API.Tests/
        Account Centric Operations.cy.js
        Customer Centric Operations.cy.js
        Loan Centric Operations.cy.js
        Position Centric Operations.cy.js
    UI.Tests/
        Accessibility Tests.cy.js
        Menu Interaction on Main Page.cy.js
        Miscellaneous.cy.js
        Radio Buttons and Dropdowns on Admin page.cy.js
        Viewport Sanity Check.cy.js
    Userflow.Tests/
        Contact Form Userflow.cy.js
        Login Userflow.cy.js
        Registration Userflow.cy.js
    Fixtures/
        API.data/
          apiUser.data.js
        Form.data/
          formInput.data.js
        URL.data/
          footerLinks.data.js
          mainMenuLinks.data.js
          pageLinks.data.js
          topNavLinks.data.js
        UX.data/
          UI.Elements.data.js
          viewportSizes.data.js
    Support/
        API.support.utils/
          getRequests.js
          postRequests.js
        Form/UserFlow.Support/
          dynamicForm.js
          generateNewUser.js
        General.Support/
          helperFunctions.js
        UI.Support/
          checkPageActiveState.js
          interactiveMethods.js
          tabbingBehavior.js
          viewportSanity.js
        Commands.js
    cypress.config.js
    jsconfig.json
    package-lock.json
    package.json
    README.md
```


