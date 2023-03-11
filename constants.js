const ERROR_CODES = {
    DUPLICATED_EMAIL: 'duplicated-email',
    INVALID_FIELD: 'invalid-post-field',
    INVALID_LOGIN: 'invalid-login',
    INVALID_CONFIRM_TOKEN: 'invalid-confirm-token',
    ACTIVATED_TOKEN: 'activated-token',
    USER_NOT_FOUND: 'user-not-found',
    ACTIVITY_NOT_FOUND: 'activity-not-found'
};

const mongoDBUser = 'codellege';
const mongoDBPassword = 'codellege';
const mongoDBDatabase = 'Socializher';
const MONGO_DB_CLUSTER = `mongodb+srv://${mongoDBUser}:${mongoDBPassword}@cluster0.6i37a.mongodb.net/${mongoDBDatabase}?retryWrites=true&w=majority`;

const COOKIES = {
    SSID: 'SSID',
    SH_TK: 'SH_TK'
};

module.exports = {
    ERROR_CODES: ERROR_CODES,
    MONGO_DB_CLUSTER: MONGO_DB_CLUSTER,
    COOKIES: COOKIES
};