var express = require('express');
const app = express.Router();
const Axios = require('axios');
const User = require('../models/user');
const Activity = require('../models/activity');
const constants = require('../utils/constants');
const utils = require('../utils/utils');

const Validate = require('../validation/validate');

const DROPBOX = {
    TOKEN: 'YZwxYdb71ncAAAAAAAAAAb2p1r1Svfh_RbRaCaOZYlcOyJqgwSx65H2NdSOxkpEf',
    API_FILES_V2: 'https://content.dropboxapi.com/2/files',
    API_SHARING_V2: 'https://api.dropboxapi.com/2/sharing/'
};

app.post('/create', async function (req, res) {
    var query = req.query;
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
    }, {
        __v: 0,
        _id: 0,
        password: 0,
        permissions: 0
    });

    if (validUser && validUser.sessions) {
        //Revisar permisos del usuario... Puede publicar? Comentar? etc...
        if (validUser.sessions[SH_TK] && validUser.sessions[SH_TK].active) {
            //Crear actividad...

            body.details = body.details || 'No hay descripción de la publicación.';
            body.details = body.details.trim();
            body.details = body.details === '' || body.details === 'null' || body.details === 'undefined' ?
                'No hay descripción de la publicación.' : body.details;

            const {
                error
            } = Validate.activity(body);
            if (error) {
                return res.status(400).send(utils.generateError(constants.ERROR_CODES.INVALID_FIELD, error));
            }

            if (body.userRef === validUser.id) {
                delete body.userRef;
            }


            var parentActivity = null;
            if (body.parentActivityId) {
                parentActivity = await Activity.findOne({
                    id: body.parentActivityId
                });

                if (!parentActivity) {
                    var err = 'No se ha encontrado la actividad padre.';
                    return res.status(404).send(utils.generateError(constants.ERROR_CODES.INVALID_FIELD, err));
                }
            }

            //Validar si viene en el files el req.files.media
            var activity = new Activity({
                id: utils.generateUserUniqueID(validUser.email),
                userId: validUser.id,
                userRef: body.userRef || null,
                date: new Date(),
                details: body.details,
                type: body.type,
                reactions: {
                    length: 0
                },
                comments: []
            });

            //subir las imágenes a Dropbox y añadir las referencias de éstas al post
            //las referencias van en el campo media[]. Es un arreglo, solo hay que hacer push
            //console.log(files);
            if (files.images) {
                if (files.images.length) {
                    for (var i = 0; i < files.images.length; i++) {
                        const image = files.images[i];
                        try {
                            image.name = image.name.replace(/[^A-Za-z0-1_]{1}/g, '_');
                            const fileName = `${utils.generateUserUniqueID(image.name)}_${image.name}`;

                            await Axios.post(DROPBOX.API_FILES_V2 + '/upload', Buffer.from(image.data), {
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

                            var media = share_link_request.data.url.replace('dl=0', 'raw=1');
                            activity.media.push(media);
                        } catch (error) {
                            console.error(error);
                        }
                    }
                } else {
                    const image = files.images;
                    try {
                        image.name = image.name.replace(/[^A-Za-z0-1_]{1}/g, '_');
                        const fileName = `${utils.generateUserUniqueID(image.name)}_${image.name}`;

                        await Axios.post(DROPBOX.API_FILES_V2 + '/upload', Buffer.from(image.data), {
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

                        var media = share_link_request.data.url.replace('dl=0', 'raw=1');
                        activity.media.push(media);
                    } catch (error) {
                        console.error(error);
                    }
                }
                await activity.markModified('media');
            }
            
            if (parentActivity) {
                activity.parentActivityId = parentActivity.id;
                parentActivity.comments.push(activity.id);
                await parentActivity.markModified('comments');
                await parentActivity.save();
            }
            
            await activity.save();

            return res.send({
                status: 'ok',
                created: true
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

//url/activities/profile
app.get('/profile', async function (req, res) {
    var query = req.query;
    var body = req.body;

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
        //Revisar permisos del usuario... Puede publicar? Comentar? etc...
        if (validUser.sessions[SH_TK] && validUser.sessions[SH_TK].active) {
            //Buscar actividades relacionadas a este user...
            //Ya sea que el userId sea el mismo que el validUser.id && userRef sea vacío
            //O que el userId sea diferente al validUser.id && userRef sea mi user
            var actividades = await Activity.find({
                $or: [{
                    $and: [{
                        userId: validUser.id
                    }, {
                        userRef: null
                    }, {

                        type: "POST"
                    }]
                }, {
                    $and: [{
                        $ne: {
                            userId: validUser.id
                        }
                    }, {
                        userRef: validUser.id
                    }, {
                        type: "POST"
                    }]
                }]
            }).sort({
                date: -1
            });

            var users = {};
            var activities = [];
            //ES6 utilities + lambda
            for (var i = 0; i < actividades.length; i++) {
                const activity = actividades[i];

                if (!users[activity.userId]) {
                    users[activity.userId] = await User.findOne({
                        id: activity.userId
                    });
                }

                var newActivity = activity.toObject();
                delete newActivity.__v;
                delete newActivity._id;

                newActivity.user = users[activity.userId] ? {
                    name: users[activity.userId].name,
                    lastName: users[activity.userId].lastName
                } : null;

                activities.push(newActivity);
            }
            /*actividades.forEach( async (activity, i) => {
            });*/

            return res.send(activities);
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

app.get('/profile/:userId', async function (req, res) {
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
    }, {
        __v: 0,
        _id: 0,
        password: 0,
        permissions: 0
    });

    if (validUser && validUser.sessions) {
        //Revisar permisos del usuario... Puede publicar? Comentar? etc...
        if (validUser.sessions[SH_TK] && validUser.sessions[SH_TK].active) {
            //Buscar actividades relacionadas a este user...
            //Ya sea que el userId sea el mismo que el validUser.id && userRef sea vacío
            //O que el userId sea diferente al validUser.id && userRef sea mi user
            var actividades = await Activity.find({
                $or: [{
                    $and: [{
                        userId: userId
                    }, {
                        userRef: null
                    }, {
                        type: "POST"
                    }]
                }, {
                    $and: [{
                        $ne: {
                            userId: userId
                        }
                    }, {
                        userRef: userId
                    }, {
                        type: "POST"
                    }]
                }]
            }).sort({
                date: -1
            });

            var users = {};
            var activities = [];
            //ES6 utilities + lambda
            for (var i = 0; i < actividades.length; i++) {
                const activity = actividades[i];

                if (!users[activity.userId]) {
                    users[activity.userId] = await User.findOne({
                        id: activity.userId
                    });
                }

                var newActivity = activity.toObject();
                delete newActivity.__v;
                delete newActivity._id;

                newActivity.user = users[activity.userId] ? {
                    name: users[activity.userId].name,
                    lastName: users[activity.userId].lastName
                } : null;

                activities.push(newActivity);
            }
            /*actividades.forEach( async (activity, i) => {
            });*/

            return res.send(activities);
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

//endpoint para consultar una activity por individual...
//El caso es para los comentarios, son ids individuales
//Y por performance no es necesario cargarlos hasta que sea necesario
app.get('/:id/comments', async function (req, res) {

    const activityID = req.params.id;

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
        //Revisar permisos del usuario... Puede publicar? Comentar? etc...
        if (validUser.sessions[SH_TK] && validUser.sessions[SH_TK].active) {
            //Buscar comentarios de ese activity
            var parentActivity = await Activity.findOne({
                id: activityID
            });

            if (!parentActivity) {
                var err = 'No se ha encontrado la actividad padre.';
                return res.status(404).send(utils.generateError(constants.ERROR_CODES.INVALID_FIELD, err));
            }

            if (!parentActivity.comments) {
                return res.send([]);
            }

            var comments = [];
            var users = {};
            parentActivity.comments = parentActivity.comments.reverse();
            for (var i = 0; i < parentActivity.comments.length; i++) {
                const commentID = parentActivity.comments[i];
                var comment = await Activity.findOne({
                    id: commentID
                });

                if (comment) {
                    if (!users[comment.userId]) {
                        users[comment.userId] = await User.findOne({
                            id: comment.userId
                        });
                    }

                    var newComment = comment.toObject();
                    delete newComment.__v;
                    delete newComment._id;

                    newComment.user = users[comment.userId] ? {
                        id: users[comment.userId].id,
                        name: users[comment.userId].name,
                        lastName: users[comment.userId].lastName
                    } : null;

                    comments.push(newComment);
                }
            }

            return res.send(comments);

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
})

app.delete('/:id', async function (req, res) {
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
        //Revisar permisos del usuario... Puede publicar? Comentar? etc...
        if (validUser.sessions[SH_TK] && validUser.sessions[SH_TK].active) {
            var activity = await Activity.findOne({
                $or: [{
                        id: req.params.id,
                        userId: validUser.id
                    },
                    {
                        id: req.params.id,
                        userRef: validUser.id
                    }
                ]
            });

            if (activity) {
                if (activity.comments) {
                    for (var i = 0; i < activity.comments.length; i++) {
                        const comment = activity.comments[i];
                        await Activity.deleteOne({
                            id: comment
                        });
                    }
                }

                if (activity.type === "COMMENT") {

                    parentActivity = await Activity.findOne({
                        id: activity.parentActivityId
                    });

                    if (!parentActivity) {
                        var err = 'No se ha encontrado la actividad padre.';
                        return res.status(404).send(utils.generateError(constants.ERROR_CODES.INVALID_FIELD, err));
                    }

                    var index = parentActivity.comments.findIndex(id => id === activity.id);
                    parentActivity.comments.splice(index, 1);
                    parentActivity.markModified('comments');
                    await parentActivity.save();
                }

                await Activity.deleteOne({
                    id: req.params.id
                });

                return res.send({
                    deleted: true,
                    userAuth: true,
                    found: true
                });
            }

            return res.send({
                deleted: false,
                userAuth: true,
                found: false
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

app.put('/:id/:reactionType', async function (req, res) {
    const activityID = req.params.id;
    const reactionType = req.params.reactionType;

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
        //Revisar permisos del usuario... Puede publicar? Comentar? etc...
        if (validUser.sessions[SH_TK] && validUser.sessions[SH_TK].active) {
            
            const {
                error
            } = Validate.reaction(reactionType);
            if (error) {
                return res.status(400).send(utils.generateError(constants.ERROR_CODES.INVALID_FIELD, error));
            }

            var activity = await Activity.findOne({
                id: activityID
            });

            if(!activity) {
                var err = 'No se ha encontrado el post especificado.'
                return res.status(404).send(utils.generateError(constants.ERROR_CODES.ACTIVITY_NOT_FOUND, err));
            }

            //legacy, no se implementó correctamente desde el inicio
            if(!activity.reactions) {
                activity.reactions = {
                    length: 0
                };
            }

            if(!activity.reactions[reactionType]) {
                activity.reactions[reactionType] = 1;
            } else {
                activity.reactions[reactionType]++;
            }
            
            activity.reactions.length++;
            
            await activity.markModified('reactions');
            await activity.save();

            return res.send(activity.reactions);

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