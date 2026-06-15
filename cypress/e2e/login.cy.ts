// enable TypeScript and IntelliSense support for Cypress
/// <reference types="cypress" />

describe('Authentication flow tests', () => {
  let baseUrl: string;
  let email: string;
  let password: string;

  // Base configuration
  before(() => {
    cy.env(['BASE_URL', 'TEST_USER_EMAIL', 'TEST_USER_PASSWORD']).then((vars) => {
      baseUrl = vars.BASE_URL ?? 'http://localhost:3000';
      email = vars.TEST_USER_EMAIL ?? 'super@example.com';
      password = vars.TEST_USER_PASSWORD ?? 'Password123$9';
    });
  });

  beforeEach(() => {
    // Clear cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();

    // Ignore React hydration mismatches so tests can proceed
    cy.on('uncaught:exception', (err) => {
      if (/Hydration failed/.test(err.message)) {
        return false;
      }
      // let other errors fail the test
      return undefined;
    });
  });

  describe('Login functionality', () => {
    it('logs in successfully with valid credentials', () => {
      // Check server response before visiting
      cy.request({
        url: `${baseUrl}/en-US/login`,
        failOnStatusCode: false,
      }).then((response) => {
        cy.log(`Status: ${response.status}`);
        cy.log(`Body: ${JSON.stringify(response.body).slice(0, 500)}`);
      });

      // Visit login page
      cy.visit(`${baseUrl}/en-US/login`);

      // Step 1: Enter email
      cy.get('[data-testid="emailInput"]')
        .should('be.visible')
        .type(email);

      cy.get('[data-testid="actionContinue"]')
        .should('be.enabled')
        .click();

      // Step 2: Enter password
      cy.get('[data-testid="passInput"]')
        .should('be.visible')
        .type(password, { log: false }); // hide password in logs

      cy.get('[data-testid="actionSubmit"]')
        .should('be.enabled')
        .click();

      // Expect to be redirected to homepage or dashboard
      cy.location('pathname').should('match', /^\/en-US\/?$/);
      // Verify authentication cookies are set
      cy.getCookie('dmspt').should('exist'); // access token
      cy.getCookie('dmspr').should('exist'); // refresh token
    });
  });
});

