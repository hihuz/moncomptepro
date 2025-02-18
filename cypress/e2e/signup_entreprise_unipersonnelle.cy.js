const MONCOMPTEPRO_HOST =
  Cypress.env('MONCOMPTEPRO_HOST') || 'http://localhost:3000';

describe('Signup into new entreprise unipersonnelle', () => {
  before(function () {
    return cy
      .mailslurp()
      .then((mailslurp) => mailslurp.createInbox())
      .then((inbox) => {
        // save inbox id and email address to this (make sure you use function and not arrow syntax)
        cy.wrap(inbox.id).as('inboxId');
        cy.wrap(inbox.emailAddress).as('emailAddress');
      });
  });

  it('creates a user', function () {
    // Visit the signup page
    cy.visit(`${MONCOMPTEPRO_HOST}/users/start-sign-in`);

    // Sign up with the previously created inbox
    cy.get('[name="login"]').type(this.emailAddress);
    cy.get('[type="submit"]').click();

    cy.get('[name="password"]').type(
      'This super secret password is hidden well!'
    );
    cy.get('[action="/users/sign-up"]  [type="submit"]').click();

    // Check that the website is waiting for the user to verify their email
    cy.get('#verify-email > p').contains(this.emailAddress);

    // Verify the email with the code received by email
    cy.mailslurp()
      // use inbox id and a timeout of 30 seconds
      .then((mailslurp) =>
        mailslurp.waitForLatestEmail(this.inboxId, 60000, true)
      )
      // extract the verification code from the email subject
      .then((email) => {
        const matches = /.*<strong>(\s*(?:\d\s*){10})<\/strong>.*/.exec(
          email.body
        );
        if (matches && matches.length > 0) {
          return matches[1];
        }
        throw new Error('Could not find verification code in received email');
      })
      // fill out the verification form and submit
      .then((code) => {
        cy.get('[name="verify_email_token"]').type(code);
        cy.get('[type="submit"]').click();
      });

    // Fill the user's personal information
    cy.get('[name="given_name"]').type('Georges');
    cy.get('[name="family_name"]').type('Moustaki');
    cy.get('[name="phone_number"]').type('0123456789');
    cy.get('[name="job"]').type('Chargé de relation usager');
    cy.get('[type="submit"]').click();

    // Fill the user's organization information
    cy.get('[name="siret"]').type('49871959000107');
    cy.get('[type="submit"]').click();

    // Click on "continue" on the welcome page
    cy.get('[type="submit"]').click();

    // Check redirection to home page
    cy.contains('Votre compte est créé');
    cy.mailslurp()
      // use inbox id and a timeout of 30 seconds
      .then((mailslurp) =>
        mailslurp.waitForLatestEmail(this.inboxId, 60000, true)
      )
      // assert reception of confirmation email
      .then((email) => {
        // characters é can triggers this error:
        // AssertionError: expected 'Votre compte MonComptePro a bien Ã©tÃ© crÃ©Ã©' to equal 'Votre compte MonComptePro a bien été créé'
        // we use a regexp to get around this issue.
        expect(email.subject).to.match(
          /Votre compte MonComptePro a bien ..?t..? cr..?..?/
        );
      });
  });
});
