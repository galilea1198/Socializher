var express = require('express');
const Axios = require('axios');
const Activator = require('../models/activator');
const Reseter = require('../models/reseter');
const app = express.Router();
const User = require('../models/user');
const constants = require('../utils/constants');
const emailer = require('../utils/emailer');
const utils = require('../utils/utils');

const Validate = require('../validation/validate');

const DROPBOX = {
    TOKEN: 'YZwxYdb71ncAAAAAAAAAAb2p1r1Svfh_RbRaCaOZYlcOyJqgwSx65H2NdSOxkpEf',
    API_FILES_V2: 'https://content.dropboxapi.com/2/files',
    API_SHARING_V2: 'https://api.dropboxapi.com/2/sharing/'
};

app.get('/profile', async function (req, res) {
    var query = req.query;
    const SSID = req.cookies[constants.COOKIES.SSID];
    const SH_TK = req.cookies[constants.COOKIES.SH_TK];

    if (!SSID || !SH_TK) {
        res.clearCookie(constants.COOKIES.SSID);
        res.clearCookie(constants.COOKIES.SH_TK);
        return res.status(403).send(utils.generateError(constants.ERROR_CODES.INVALID_LOGIN, 'Tokens inválidos. Por favor, inicie sesión nuevamente.'));
    }

    var validUser = await User.findOne({
        id: SSID
    }, {
        __v: 0,
        _id: 0,
        password: 0,
        permissions: 0
    });

    if (validUser && validUser.sessions) {
        if (validUser.sessions[SH_TK] && validUser.sessions[SH_TK].active) {
            //Todo bien, está loggeado correctamente
            var usuarioFinal = validUser.toObject();
            delete usuarioFinal.sessions;
            return res.send(usuarioFinal);
        } else {
            //No existe ese token o no está activo
            res.clearCookie(constants.COOKIES.SSID);
            res.clearCookie(constants.COOKIES.SH_TK);
            return res.status(403).send(utils.generateError(constants.ERROR_CODES.INVALID_LOGIN, 'Tokens inválidos. Por favor, inicie sesión nuevamente.'));
        }
    } else {
        //Este usuario no tiene sesiones... Qué hace aquí xd
        res.clearCookie(constants.COOKIES.SSID);
        res.clearCookie(constants.COOKIES.SH_TK);
        return res.status(403).send(utils.generateError(constants.ERROR_CODES.INVALID_LOGIN, 'Tokens inválidos. Por favor, inicie sesión nuevamente.'));
    }

});

app.get('/profile/:profileID', async function (req, res) {
    var profileID = req.params.profileID;

    var user = await User.findOne({
        $or:[
            { id: profileID },
            { username: profileID }
        ]
    }, {
        _id: 0,
        __v: 0,
        active: 0,
        sessions: 0,
        permissions: 0,
        password: 0
    });

    if(!user) {
        return res.status(404).send(utils.generateError(constants.ERROR_CODES.USER_NOT_FOUND, 'Este usuario no existe :('));
    }

    res.send(user);
});

app.put('/profile', async function (req, res) {

    var query = req.query || {};
    var body = req.body || {};
    var files = req.files || {};
    const SSID = req.cookies[constants.COOKIES.SSID];
    const SH_TK = req.cookies[constants.COOKIES.SH_TK];

    if (!SSID || !SH_TK) {
        res.clearCookie(constants.COOKIES.SSID);
        res.clearCookie(constants.COOKIES.SH_TK);
        return res.status(403).send(utils.generateError(constants.ERROR_CODES.INVALID_LOGIN, 'Tokens inválidos. Por favor, inicie sesión nuevamente.'));
    }

    var validUser = await User.findOne({
        id: SSID
    });

    if (validUser && validUser.sessions) {
        if (validUser.sessions[SH_TK] && validUser.sessions[SH_TK].active) {
            //Todo bien, está loggeado correctamente
            //Actualizar el usuario...
            var bodyVariables = Object.keys(body);
            const Joi = require('@hapi/joi');
            const updatedProperties = {};
            for (var i = 0; i < bodyVariables.length; i++) {
                var error;
                const llave = bodyVariables[i];
                updatedProperties[llave] = true;
                switch (llave) {
                    case "username":
                        error = Joi.string().validate(body.username).error;
                        var usernameExiste = await User.findOne({
                            username: body.username
                        });
                        if (usernameExiste) {
                            error = `El nombre de usuario '${body.username}' ya está en uso.`;
                        }
                        validUser.username = body.username;
                        break;

                    case "name":
                        error = Joi.string().validate(body.name).error;
                        validUser.name = body.name;
                        break;

                    case "lastName":
                        error = Joi.string().validate(body.lastName).error;
                        validUser.lastName = body.lastName;
                        break;

                    case "sex":
                        error = Joi.string().valid('H', 'M').validate(body.sex).error;
                        validUser.sex = body.sex;
                        break;

                    case "email":
                        error = Joi.string().email().validate(body.email).error;
                        var emailExiste = await User.findOne({
                            email: body.email
                        });
                        if (emailExiste) {
                            error = `El correo '${body.email}' ya está en uso.`;
                        }
                        validUser.email = body.email;
                        break;

                    case "password":
                        error = Joi.string().min(8).max(16).validate(body.password).error;
                        validUser.password = body.password;
                        break;

                    case "phone":
                        error = Joi.string().min(10).max(10).validate(body.phone).error;
                        validUser.phone = body.phone;
                        break;

                    case "birth":
                        error = Joi.date().validate(body.birth).error;
                        validUser.birth = body.birth;
                        break;

                    case "description":
                        error = Joi.string().validate(body.description).error;
                        validUser.description = body.description;
                        break;

                    default:
                        delete updatedProperties[llave];
                        break;
                }

                if (error) {
                    return res.status(400).send(utils.generateError(constants.ERROR_CODES.INVALID_FIELD, error));
                }
            }

            if (files.profilePicture) {
                //Actualizar el profile picture, subir la imagen que mandó a dropbox
                try {
                    files.profilePicture.name = files.profilePicture.name.replace(/[^A-Za-z0-1_]{1}/g, '_');
                    const fileName = `${utils.generateUserUniqueID(files.profilePicture.name)}_${files.profilePicture.name}`;

                    await Axios.post(DROPBOX.API_FILES_V2 + '/upload', Buffer.from(files.profilePicture.data), {
                        headers: {
                            "Authorization": "Bearer " + DROPBOX.TOKEN,
                            "Content-Type": "application/octet-stream",
                            "Dropbox-API-Arg": `{ "path": "/Socializher/${fileName}", "mode": "add", "autorename": true, "mute": false, "strict_conflict": false }`
                        }
                    });

                    var share_link_request = await Axios.post(DROPBOX.API_SHARING_V2 + '/create_shared_link_with_settings', `{
                        "path": "/Socializher/${fileName}",
                        "settings": {
                            "audience": "public",
                            "access": "viewer",
                            "requested_visibility": "public",
                            "allow_download": true
                        }
                    }`, {
                        headers: {
                            "Authorization": "Bearer " + DROPBOX.TOKEN,
                            "Content-Type": "application/json",
                        }
                    });

                    validUser.profilePicture = share_link_request.data.url.replace('dl=0', 'raw=1');

                } catch (error) {
                    console.error(error);
                }
            }

            if (files.profileCover) {
                //Actualizar el profile picture, subir la imagen que mandó a dropbox
                try {
                    files.profileCover.name = files.profileCover.name.replace(/[^A-Za-z0-1_]{1}/g, '_');
                    const fileName = `${utils.generateUserUniqueID(files.profileCover.name)}_${files.profileCover.name}`;

                    await Axios.post(DROPBOX.API_FILES_V2 + '/upload', Buffer.from(files.profileCover.data), {
                        headers: {
                            "Authorization": "Bearer " + DROPBOX.TOKEN,
                            "Content-Type": "application/octet-stream",
                            "Dropbox-API-Arg": `{ "path": "/Socializher/${fileName}", "mode": "add", "autorename": true, "mute": false, "strict_conflict": false }`
                        }
                    });

                    var share_link_request = await Axios.post(DROPBOX.API_SHARING_V2 + '/create_shared_link_with_settings', `{
                        "path": "/Socializher/${fileName}",
                        "settings": {
                            "audience": "public",
                            "access": "viewer",
                            "requested_visibility": "public",
                            "allow_download": true
                        }
                    }`, {
                        headers: {
                            "Authorization": "Bearer " + DROPBOX.TOKEN,
                            "Content-Type": "application/json",
                        }
                    });

                    validUser.profileCover = share_link_request.data.url.replace('dl=0', 'raw=1');

                } catch (error) {
                    console.error(error);
                }
            }

            await validUser.save();
            var affectedFields = Object.keys(updatedProperties).length;
            return res.send({
                updated: affectedFields > 0,
                updatedProperties: updatedProperties,
                affectedFields: affectedFields
            });

            //["name", "lastName", "a", "b", "c"]
            //var llave = bodyVariables[1];
            //objeto[llave] -> objeto.lastName
            /*var objeto = {
                name: 1,
                lastName: 2,
                a: 1,
                b: 2,
                c: false
            };*/
        } else {
            //No existe ese token o no está activo
            res.clearCookie(constants.COOKIES.SSID);
            res.clearCookie(constants.COOKIES.SH_TK);
            return res.status(403).send(utils.generateError(constants.ERROR_CODES.INVALID_LOGIN, 'Tokens inválidos. Por favor, inicie sesión nuevamente.'));
        }
    } else {
        //Este usuario no tiene sesiones... Qué hace aquí xd
        res.clearCookie(constants.COOKIES.SSID);
        res.clearCookie(constants.COOKIES.SH_TK);
        return res.status(403).send(utils.generateError(constants.ERROR_CODES.INVALID_LOGIN, 'Tokens inválidos. Por favor, inicie sesión nuevamente.'));
    }
});

app.post('/register', async function (req, res) {

    var body = req.body;
    var query = req.query;
    var params = req.params;

    const {
        error
    } = Validate.register(body);
    if (error) {
        return res.status(400).send(utils.generateError(constants.ERROR_CODES.INVALID_FIELD, error));
    }

    //Y si ya existe ese usuario con ese correo?
    //Debe decir que ya está registrado...
    var userExists = await User.findOne({
        email: body.email.toLowerCase()
    });
    if (userExists) {
        return res.status(403).send(utils.generateError(constants.ERROR_CODES.DUPLICATED_EMAIL, `El correo: ${body.email} ya se encuentra registrado`));
    }

    var userCreado = req.body;
    userCreado.email = userCreado.email.toLowerCase();
    userCreado.id = utils.generateUserUniqueID(userCreado.email);
    userCreado.permissions = {
        admin: false,
        moderator: false,
        create: true,
        comment: true,
        react: true
    };
    userCreado.active = false;

    var usuarioPrueba = new User(userCreado);
    await usuarioPrueba.save();

    var userActivator = new Activator({
        id: utils.generateActivatorID(userCreado.id),
        userID: userCreado.id,
        activated: false
    });

    await userActivator.save();

    //Mandar correo de confirmación...
    //Se manda al correo del registro, o sea, al userCreado.email
    emailer.sendConfirmation(userCreado, userActivator.id);

    res.send({
        valid: true,
        registered: true
    });
});

app.get('/confirm/:confirmToken', async function (req, res) {
    var params = req.params;
    var confirmToken = params.confirmToken;

    var activator = await Activator.findOne({
        id: confirmToken
    });

    if (!activator) {
        var error = 'Este token no está ligado a ninguna cuenta para activar.';
        return res.status(404).send(utils.generateError(constants.ERROR_CODES.INVALID_CONFIRM_TOKEN, error));
    } else if (activator.activated) {
        var error = 'Esta cuenta ya ha sido activada.';
        return res.status(403).send(utils.generateError(constants.ERROR_CODES.ACTIVATED_TOKEN, error));
    }

    var userActivar = await User.findOne({
        id: activator.userID
    });

    if (!userActivar) {
        var error = 'Este token hace referencia a un usuario que ya no existe.';
        return res.status(404).send(utils.generateError(constants.ERROR_CODES.USER_NOT_FOUND, error));
    }

    userActivar.active = true;
    activator.activated = true;

    await userActivar.save();
    await activator.save();

    res.redirect('/login');
});

app.post('/login', async function (req, res) {
    var body = req.body;
    var query = req.query;
    var params = req.params;

    const {
        error
    } = Validate.login(body);
    if (error) {
        return res.status(400).send(utils.generateError(constants.ERROR_CODES.INVALID_FIELD, error));
    }

    var validLogin = await User.findOne({
        email: body.email.toLowerCase(),
        password: body.password,
        active: true
    });

    if (!validLogin) {
        return res.status(403).send(utils.generateError(constants.ERROR_CODES.INVALID_LOGIN, 'El correo y/o contraseña no son correctos o aún no ha activado su cuenta.'));
    }

    var SSID = validLogin.id;
    var token = utils.generateSessionToken();
    if (!validLogin.sessions) {
        validLogin.sessions = {};
    }

    validLogin.sessions[token] = {
        active: true,
        logged: true
    };

    await validLogin.markModified('sessions');
    await validLogin.save();

    var date = new Date();
    date.setDate(date.getDate() + 365);
    res.cookie('SSID', SSID, {
        expires: date,
        httpOnly: false,
        sameSite: 'Lax'
    });

    res.cookie('SH_TK', token, {
        expires: date,
        httpOnly: false,
        sameSite: 'Lax'
    });

    //return res.redirect('/profile');
    res.send({
        valid: true,
        logged: true
    });
});

app.post('/logout', async function(req, res){
    
    const SSID = req.cookies[constants.COOKIES.SSID];
    const SH_TK = req.cookies[constants.COOKIES.SH_TK];

    if (!SSID || !SH_TK) {
        res.clearCookie(constants.COOKIES.SSID);
        res.clearCookie(constants.COOKIES.SH_TK);
        return res.status(403).send(utils.generateError(constants.ERROR_CODES.INVALID_LOGIN, 'Tokens inválidos. Por favor, inicie sesión nuevamente.'));
    }

    var validUser = await User.findOne({
        id: SSID
    });

    if (validUser && validUser.sessions) {
        if (validUser.sessions[SH_TK] && validUser.sessions[SH_TK].active) {
            validUser.sessions[SH_TK].active = false;
            await validUser.save();
        }
    }

    res.clearCookie(constants.COOKIES.SSID);
    res.clearCookie(constants.COOKIES.SH_TK);

    return res.send({
        logout: true
    });
});

app.post('/reset/password', async function(req, res) {
    var body = req.body || {};
    if(body.email) {
        //crear un enlace de recuperación
        var user = await User.findOne({
            email: body.email
        });

        if(!user) {
            return res.send({
                status: 'ok'
            });
        }

        const resetID = utils.generateActivatorID(user.id);
        var passwordReset = new Reseter({
            id: resetID,
            userID: user.id
        });

        await passwordReset.save();
        
        await emailer.sendRecovery(user, resetID);
    }

    return res.send({
        status: 'ok'
    });
});

app.get('/reset/check/:token', async function(req, res) {
    var token = req.params.token;
    var validToken = await Reseter.findOne({
        id: token
    });

    if(validToken) {
        return res.send({
            valid: true
        });
    }

    return res.send({
        valid: false
    });
});

app.put('/reset/password', async function(req, res) {
    var body = req.body || {};
    const {
        error
    } = Validate.resetPassword(body);
    if (error) {
        return res.status(400).send(utils.generateError(constants.ERROR_CODES.INVALID_FIELD, error));
    }

    var validToken = await Reseter.findOne({
        id: body.resetToken
    });

    if(!validToken) {
        var err = 'Este token no está ligado a ninguna cuenta para recuperar.';
        return res.status(400).send(utils.generateError(constants.ERROR_CODES.INVALID_CONFIRM_TOKEN, err));
    }

    var user = await User.findOne({
        id: validToken.userID
    });

    if(!user) {
        return res.status(404).send(utils.generateError(constants.ERROR_CODES.USER_NOT_FOUND, 'Este usuario no existe :('));
    }

    user.password = body.password;
    await user.save();

    await Reseter.deleteOne({
        id: body.resetToken
    });

    return res.send({
        recovered: true
    });

});

module.exports = app;