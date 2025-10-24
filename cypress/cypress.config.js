// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://parabank.parasoft.com/parabank',
    supportFile: 'cypress/support/e2e.js',                     // <-- load this before every test
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',        // <-- your specs should match this
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
