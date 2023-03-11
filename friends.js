var express = require('express');
const app = express.Router();
const User = require('../models/user');
const constants = require('../utils/constants');
const utils = require('../utils/utils');

const Validate = require('../validation/validate');

app.put('/add/:userId', async function (req, res) {
    var userId = req.params.userId;
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
            //Si no tengo añadido a este compa...
            if (!validUser.friends.some(friend => friend === userId)) {
                validUser.friends.push(userId);

                await validUser.markModified('friends');
                await validUser.save();

                return res.send({
                    ok: true,
                    added: true,
                    userAdded: userId
                });
            }

            return res.send({
                ok: true,
                added: false,
                alreadyAdded: true,
                userAdded: userId
            });
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

app.delete('/delete/:userId', async function (req, res) {
    var userId = req.params.userId;
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
            //Si no tengo añadido a este compa...
            var friendIndex = validUser.friends.findIndex(friend => friend === userId);
            if (friendIndex === -1) {
                return res.send({
                    deleted: false,
                    added: false,
                    userAdded: userId
                });
            }

            validUser.friends.splice(friendIndex, 1);
            await validUser.markModified('friends');
            await validUser.save();

            return res.send({
                deleted: true,
                added: true,
                userAdded: userId
            });
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

app.get('/', async function (req, res) {
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
            return res.send(validUser.friends);
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

app.get('/search', async function (req, res) {
    var query = req.query;

    if (!query.q) {
        return res.send([]);
    } else {
        var users = await User.find({
            $or: [{
                    name: {
                        $regex: query.q,
                        $options: 'i'
                    }
                },
                {
                    lastName: {
                        $regex: query.q,
                        $options: 'i'
                    }
                }
            ]
        }, {
            __v: 0,
            _id: 0,
            password: 0,
            permissions: 0,
            sessions: 0,
        });

        res.send(users);
    }
});

app.get('/:userId', async function (req, res) {
    var userId = req.params.userId;
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
            return res.send(validUser.friends.some(friend => friend === userId));
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

module.exports = app;