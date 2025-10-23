// cypress.config.js
const { defineConfig } = require('cypress');
const fs = require('fs')
const path = require('path');
const newman = require('newman');

function toKeyVal(bag) {
  return (bag & bag.values)
    ? Object.fromEntries(bag.values.filter(v => v && v.key != null).map(v => [String(v.key), v.value]))
    : {};
}




module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://parabank.parasoft.com/parabank',
    supportFile: 'cypress/support/e2e.js',                     // <-- load this before every test
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',        // <-- your specs should match this
    setupNodeEvents(on, config) {
      // ✅ register tasks here
      on('task', {
        // smoke task to prove tasks are wired
        ping() {
          return 'pong';
        },

        'run:newman'() {
          const OUT = path.resolve('cypress/fixtures/newman-runtime.json');
          return new Promise((resolve, reject) => {
            newman.run(
              {
                collection: path.resolve('Parabank.postman_collection.json'),
                // uncomment if you have a local env file:
                // environment: path.resolve('Parabank.postman_environment.json'),
                reporters: ['cli', 'json'],
                reporter: { json: { export: OUT } },
              },
              (err, summary) => {
                if (err) return reject(err);
                resolve({ stats: summary?.run?.stats || null, exported: OUT });
              }
            );
          });
        },


        'newman:vars': () => {
          const OUT = path.resolve('cypress/fixtures/newman-runtime.json');
          if (!fs.existsSync(OUT)) return null;
          const report = JSON.parse(fs.readFileSync(OUT, 'utf8'));
          const coll = toKeyVal(report.collectionVariables);
          const env = toKeyVal(report.environment);
          return { coll, env, stats: report.run?.stats || null };
        }
      });

      return config;
    },
  },
});
