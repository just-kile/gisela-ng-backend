/** dependencies **/
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var uniqueValidator = require('mongoose-unique-validator');
var mongoose = require('mongoose');
var NodeGeocoder = require('node-geocoder');

/** configuration files **/
var global = require('./../config/options.prod');


/** Geocoder initialisation **/

var options = {
    provider: 'google',
    // Optional depending on the providers
    httpAdapter: 'https', // Default
    apiKey: global.google.apiKey, // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);


/************* GOOGLE CALENDAR AUTHENTICATION ****************
 *************************************************************
 */

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = 'config/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

function queryDataFromGoogle() {
    // Load client secrets from a local file.
    fs.readFile('./config/client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Google Calendar API.
        authorize(JSON.parse(content), listEvents);
    });
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function (code) {
        rl.close();
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}


/**************** GOOGLE CALENDAR DATASERVICE ****************
 *************************************************************
 */

/**
 * Lists the next 2500 events on the user's defined calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
    var calendar = google.calendar('v3');
    calendar.events.list({
        auth: auth,
        calendarId: global.google.calendarId,
        timeMin: global.google.queryStartDate,
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime'
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var events = response.items;
        if (events.length == 0) {
            console.log('No upcoming events found.');
        } else {
            events.forEach((event, i) => {
                if (event.location) {
                    setTimeout(() => {
                        enterIntoMongoDb(event);
                    }, 1500 * i);
                }
            });
        }

    });
}


/**
 * Search for geocoded location of
 * @param gcalevent
 */
function enterIntoMongoDb(gcalevent) {

    // try to find the GPS-location of the provided location-string
    geocoder.geocode(gcalevent.location)
        .then(function (res) {
            // check if a valid result was returned
            if(res[0] && res[0].latitude && res[0].longitude) {
                console.log('[Geocoder] Found location for: ', gcalevent.location);

                // create new database-entry for this trip
                var trip = new Trip({
                    gCalID: gcalevent.id,
                    start: gcalevent.start.date,
                    end: gcalevent.end.date,
                    location: {
                        name: gcalevent.location,
                        latitude: res[0].latitude,
                        longitude: res[0].longitude
                    },
                    summary: gcalevent.summary,
                    description: gcalevent.description
                });

                // Save the trip to the database
                trip.save(function (err) {
                    if (err)
                        console.log("[Geocoder] Couldn't save to database: ", err);
                    else {
                        console.log('[Geocoder] Database entry sucessfully saved for: ', gcalevent.location);
                    }
                });
            } else {
                // no valid GPS-coordinates were found for this location: --> throw error
                throw new Error("[Geocoder] Couldn't locate location for: ", gcalevent.location);
            }
        })
        .catch(function (err) {
            console.log(err);
        });
}


/************* MONGOOSE DATABASE CONFIGURATION ***************
 *************************************************************
 */

mongoose.connect(global.mongoDB.mongoUrl);

var TripSchema = new mongoose.Schema({
    gCalID: {type: String, required: true, unique: true},
    start: {type: Date, required: true},
    end: {type: Date, required: true},
    location: {
        name: String,
        latitude: {type: Number, required: true},
        longitude: {type: Number, required: true}
    },
    description: String,
    summary: String,
    created_at: {type: Date, default: Date.now()},
    updated_at: {type: Date, default: Date.now()}
});

// Apply the uniqueValidator plugin to TripSchema.
// TODO: don't throw errors, instead of only inserting new values, update the existing one
TripSchema.plugin(uniqueValidator, {message: '[MongoDB] Skipping calendar entry, {VALUE} is already in database'});

// Create a model based on the schema
var Trip = mongoose.model('trip', TripSchema);


module.exports = queryDataFromGoogle;