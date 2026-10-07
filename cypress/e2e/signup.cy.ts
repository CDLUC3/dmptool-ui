// enable TypeScript and IntelliSense support for Cypress
/// <reference types="cypress" />

import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from "../../utils/authHelper";

describe('Authentication flow tests', () => {
  // Base configuration
  const baseUrl = Cypress.env('BASE_URL') || 'http://localhost:3000';

  beforeEach(() => {
    // Clear cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Signup functionality', () => {
    it('Should sign up user with valid credentials', () => {
      const timestamp = Date.now();
      const testEmail = `test.user.${timestamp}@example.com`;
      const testUserFirstName = "testUser";
      const testUserLastName = "testUserLastName";
      // Visit login page
      cy.visit(`${baseUrl}/en-US/signup`);

      // Step 1: Enter email
      cy.get('input[name="email"]')
        .should('be.visible')
        .type(testEmail);

      // Click on the "Continue" button
      cy.get('[data-testid="continue"]')
        .should('be.enabled')
        .click();

      // Step 2: Enter user info
      cy.get('input[name="first_name"]')
        .should('be.visible')
        .type(testUserFirstName);

      cy.get('input[name="last_name"]')
        .should('be.visible')
        .type(testUserLastName);

      cy.get('[name="institution"]')
        .type('National Science Foundation') // Type partial text to trigger suggestions
        .wait(500); // Optional: wait for suggestions to load

      // Then select from the institution from the dropdown options
      cy.get('[role="listbox"]').contains('National Science Foundation (nsf.gov)').click();

      cy.get('input[name="password"]')
        .should('be.visible')
        .type(Cypress.env('TEST_USER_PASSWORD'), { log: false }); // hide password in logs

      cy.get('input[name="confirmPassword"]')
        .should('be.visible')
        .type(Cypress.env('TEST_USER_PASSWORD'), { log: false }); // hide password in logs

      // Check the Accept Terms checkbox
      cy.get('label').contains('Accept terms?').click();

      // Click on the "Sign Up" button
      cy.get('[data-testid="signup"]')
        .should('be.enabled')
        .click();

      // Expect to be redirected to homepage or dashboard
      cy.url().should('eq', `${baseUrl}/en-US`);

      // Verify authentication cookies are set
      cy.getCookie(ACCESS_TOKEN_NAME).should('exist'); // access token
      cy.getCookie(REFRESH_TOKEN_NAME).should('exist'); // refresh token
    });
  });
});
