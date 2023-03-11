var express = require('express');
var mongoose = require('mongoose');
const constants = require('./utils/constants');
const utils = require('./utils/utils');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');

const app = express();

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('./public'));
app.use(cookieParser());
app.use(fileUpload({
    useTempFiles: false
}));

mongoose.connect(constants.MONGO_DB_CLUSTER, function (error) {
    if (error) {
        console.log('No se pudo conectar al cluster de Mongo: ' + error);
    } else {
        console.log('Se ha conectado al cluster de Mongo.');
        
        app.get('/', function(req, res) {
            res.redirect('/home');
        });
        
        const usersRouter = require('./routers/users');
        app.use('/users', usersRouter);

        const activitiesRouter = require('./routers/activities');
        app.use('/activities', activitiesRouter);

        const friendsRouter = require('./routers/friends');
        app.use('/friends', friendsRouter);

        const PORT = process.env.PORT || 678;
        console.log('El servidor correrá en el puerto ' + PORT);
        app.listen(PORT);
    }
});












//importar librerías al inicio
/*var http = require('http');

var server = http.createServer(function(req, res){
    res.write('<h1>Este es un web service</h1>');
    res.end();
});

console.log('El servidor corre en el puerto: 678');
server.listen(678);*/
//Cuando una función recibe de parámetro otra función...
//Se le llama CALLBACK
//Es una forma primitiva de programación asíncrona