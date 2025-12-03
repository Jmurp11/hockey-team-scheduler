import { getAppTitle, getMenuItems, getMainContent } from '../support/app.po';

describe('mobile-e2e', () => {
  beforeEach(() => cy.visit('/'));

  it('should display app title', () => {
    getAppTitle().should('contain', 'RinkLink');
    getAppTitle().should('contain', '.ai');
  });

  it('should have main content area', () => {
    getMainContent().should('exist');
  });

  it('should have menu items', () => {
    // Check that menu items exist in the DOM (they may be in a hidden menu)
    cy.get('ion-item').should('have.length.at.least', 1);
    cy.get('ion-item').first().should('contain', 'Home');
    
    // Verify the menu structure exists
    cy.get('ion-menu').should('exist');
    cy.get('ion-list').should('exist');
  });
});
