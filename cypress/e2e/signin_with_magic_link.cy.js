const MONCOMPTEPRO_HOST =
  Cypress.env('MONCOMPTEPRO_HOST') || 'http://localhost:3000';

describe('sign-in with magic link', () => {
  before(() => {
    cy.mailslurp().then((mailslurp) =>
      mailslurp.inboxController.deleteAllInboxEmails({
        inboxId: '66ac0a4c-bd2d-490e-a277-1e7c2520100d',
      })
    );
  });

  it('should sign-in', function () {
    // Visit the signup page
    cy.visit(`${MONCOMPTEPRO_HOST}/users/start-sign-in`);

    // Sign in with the existing inbox
    cy.get('[name="login"]').type(
      '66ac0a4c-bd2d-490e-a277-1e7c2520100d@mailslurp.com'
    );
    cy.get('[type="submit"]').click();

    cy.get('[action="/users/send-magic-link"]  [type="submit"]')
      .contains('Envoyer le lien')
      .click();

    cy.contains('Votre lien vous attend à l’adresse...');

    cy.mailslurp()
      // use inbox id and a timeout of 30 seconds
      .then((mailslurp) =>
        mailslurp.waitForLatestEmail(
          '66ac0a4c-bd2d-490e-a277-1e7c2520100d',
          60000,
          true
        )
      )
      // extract the connection link from the email subject
      .then((email) => {
        const matches =
          /.*<a style="text-decoration:none; color:#fff; font-weight:normal;" target="_blank" href="([^"]+)"><strong>Se connecter<\/strong><\/a>.*/.exec(
            email.body
          );
        if (matches && matches.length > 0) {
          return matches[1];
        }
        throw new Error('Could not find connection link in received email');
      })
      .then((link) => {
        cy.visit(link);
      });

    cy.contains('Votre compte est créé');
  });
});
