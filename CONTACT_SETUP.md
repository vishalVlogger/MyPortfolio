# Contact form delivery

The contact form submits name, email, and description to FormSubmit over HTTPS.
The receiving inbox is editable under **Edit site → Learning, resume & contact →
Receive contact messages at**. Existing portfolios without this field use the
initial address in `defaultPortfolio.contact.email` until the next owner save.

## One-time activation

1. Submit a short test using the contact form on the published site.
2. Complete FormSubmit's spam check if shown.
3. Open the activation email in the receiving inbox (check Spam as well), and
   confirm the form. Until this is done, email delivery is not active.
4. Submit another test and confirm it reaches the inbox. The visitor's email
   becomes the Reply-To address so the owner can reply directly.

Changing the receiving inbox may require activation again. No API key or mail
password is stored in the frontend. The native submission intentionally retains
FormSubmit's spam protection and redirects visitors back to the contact section
after submission. A submitted message is not proof of inbox delivery.

FormSubmit processes submissions; see its documentation and privacy policy:
https://formsubmit.co/documentation
https://formsubmit.co/privacy.pdf

## Editor regression check

In the skills editor, type `React, ` character by character, then `TypeScript`.
The comma and space should remain while typing. On blur, the field displays
`React, TypeScript`. Save and reload to confirm both badges persist. The same
behavior applies to project tech stacks and the currently-learning list.
