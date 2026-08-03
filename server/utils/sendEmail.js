const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert: htmlToText } = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
          this.to = user.email;
          this.firstName = user.name.split(' ')[0];
          this.url = url;
          this.from = `E-Commerce Admin <${process.env.EMAIL_FROM}>`;
    }

    // True once the SMTP/SendGrid env vars this transport needs are set -
    // lets callers fire-and-forget order/notification emails without
    // crashing or logging noise before an owner has supplied real
    // credentials (see .env.example).
    static isConfigured() {
          if (process.env.NODE_ENV === 'production') {
                  return Boolean(
                            process.env.SENDGRID_USERNAME &&
                            process.env.SENDGRID_PASSWORD &&
                            process.env.EMAIL_FROM
                          );
          }
          return Boolean(
                  process.env.EMAIL_HOST &&
                  process.env.EMAIL_PORT &&
                  process.env.EMAIL_USERNAME &&
                  process.env.EMAIL_PASSWORD &&
                  process.env.EMAIL_FROM
                );
    }

    newTransport() {
          if (process.env.NODE_ENV === 'production') {
                  // Sendgrid
            return nodemailer.createTransport({
                      service: 'SendGrid',
                      auth: {
                                  user: process.env.SENDGRID_USERNAME,
                                  pass: process.env.SENDGRID_PASSWORD
                      }
            });
          }

      return nodemailer.createTransport({
              host: process.env.EMAIL_HOST,
              port: process.env.EMAIL_PORT,
              auth: {
                        user: process.env.EMAIL_USERNAME,
                        pass: process.env.EMAIL_PASSWORD
              }
      });
    }

    async send(template, subject) {
          // 1) Render HTML based on a pug template
      const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
              firstName: this.firstName,
              url: this.url,
              subject
      });

      // 2) Define email options
      const mailOptions = {
              from: this.from,
              to: this.to,
              subject,
              html,
              text: htmlToText(html)
      };

      // 3) Create transport and send email
      await this.newTransport().sendMail(mailOptions);
    }

    async sendPasswordReset() {
          await this.send('passwordReset', 'Your password reset token (valid for 10 min)');
    }

    // Best-effort order-confirmation email - silently no-ops if
    // isConfigured() is false, so createOrder never fails or logs noise
    // just because SMTP/SendGrid credentials haven't been supplied yet.
    async sendOrderConfirmation(order, items) {
          if (!Email.isConfigured()) return;
          const html = pug.renderFile(`${__dirname}/../views/email/orderConfirmation.pug`, {
                  firstName: this.firstName,
                  url: this.url,
                  orderId: order._id.toString(),
                  items,
                  totalPrice: order.totalPrice
          });
          const mailOptions = {
                  from: this.from,
                  to: this.to,
                  subject: 'Your order is confirmed',
                  html,
                  text: htmlToText(html)
          };
          await this.newTransport().sendMail(mailOptions);
    }
};
