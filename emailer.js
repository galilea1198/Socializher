const nodemailer = require('nodemailer');
const {
    google
} = require("googleapis");
const OAuth2 = google.auth.OAuth2;

var URL = process.env.PORT ? 'https://codellege-socializher.herokuapp.com' : 'http://localhost:678';
const ACTIVATION_LINK = `${URL}/users/confirm/`;
const RESET_PASSWORD_LINK = `${URL}/recovery/`;

const ClientID = '977901520120-nctna4epbv9ns2lu5s1ape47mqekq83h.apps.googleusercontent.com';
const ClientSecret = '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';
const RefreshToken = '1//04gcPu1LwdTzKCgYIARAAGAQSNwF-L9Ir3ns0Dv5foANc6kWre2mMtZcR0_AOzxuUcu6Upz1ecKjBKAmB92R1vVYkKM8092krIic';
const Email = 'codellege.stk@gmail.com';
const AccessToken = 'ya29.A0ARrdaM9iHKsdkCTR4x6n655kaIBHU5cTI5iG5WPkvsnERfdA45ErQQhDykyDm9x-GzA5JyZ0C7fY8xlEkudWLgIT31_DmQu_LwsIaDvnUbl18k7i1TYv3AU4M0HJ9_CIA6JnAVGUTx24kWaFq7PFBUtbWpKB';

const OAuth = new OAuth2(
    ClientID,
    ClientSecret
);

OAuth.setCredentials({
    refresh_token: RefreshToken
});

module.exports = {
    sendConfirmation: async function (user, activatorId) {

        var mailer = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            auth: {
                type: 'OAuth2',
                user: Email,
                clientId: ClientID,
                clientSecret: ClientSecret,
                refreshToken: RefreshToken,
                accessToken: AccessToken
            }
        });

        await mailer.sendMail({
            from: 'Socializher <codellege.stk@gmail.com>',
            to: user.email,
            subject: 'Socializher - Registro',
            html: `<h2>Registro Socializher</h2>
                   <hr/>
                   <h3>Gracias, ${user.name} ${user.lastName} por registrarte en nuestra red :)</h3>
                   <h4>Para poder comenzar a utilizar nuestra red social, es necesario que confirmes tu cuenta a través del siguiente enlace: <a href="${ACTIVATION_LINK}${activatorId}">Activar mi cuenta</a></h4>`
        });
    },
    sendRecovery: async function (user, resetID) {

        var mailer = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            auth: {
                type: 'OAuth2',
                user: Email,
                clientId: ClientID,
                clientSecret: ClientSecret,
                refreshToken: RefreshToken,
                accessToken: AccessToken
            }
        });

        await mailer.sendMail({
            from: 'Socializher <codellege.stk@gmail.com>',
            to: user.email,
            subject: 'Socializher - Recuperación de contraseña',
            html: `<h2>Solicitud de recuperación de contraseña</h2>
                   <hr/>
                   <h3>Hola, ${user.name} ${user.lastName}. Se ha solicitado una recuperación de contraseña.</h3>
                   <h3>Si tú no has solicitado esta recuperación, haz caso omiso de este correo.</h3>
                   <h4>De lo contrario, puedes establecer una nueva contraseña para tu cuenta a través del siguiente enlace: <a href="${RESET_PASSWORD_LINK}?resetToken=${resetID}">Restaurar mi contraseña</a></h4>`
        });
    }
};