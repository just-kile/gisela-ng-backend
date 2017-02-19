var giselaCalScraper = require('./../scraper/giselaCal');
var mongoose = require('mongoose');

/**
 * define database schema
 */

var TripSchema = new mongoose.Schema({
    gCalID: {type: String, required: true, unique: true},
    start: {type: Date, required: true},
    end: {type: Date, required: true},
    location: {
        name: String,
        latitude: {type: Number, required: true},
        longitude: {type: Number, required: true},
        distanceFromHome: Number
    },
    description: String,
    summary: String,
    created_at: {type: Date, default: Date.now()},
    updated_at: {type: Date, default: Date.now()}
});

/**
 * define database model
 * @type {*}
 */
var TripModel = mongoose.model('trips', TripSchema);

/**
 * this will be our router function
 * @param app
 */

var appRouter = function(app) {

    /**
     * import any new entries from google-calendar to local mongoDb
     * caution: currently this takes up to 5min, as we have to throttle calls to google
     * TODO: (1) update exisiting entries in case something changed or has been deleted
     * TODO: (2) authentication needed to prevent DDoS of the server / ban of google-account
     * TODO: (3) use google webhook after event was created to update DB
     * TODO:     or call periodically every 30min?
     */
    app.get("/gcalfetch", function(req, res) {
        // trigger the data-gathering from google-calendar
        giselaCalScraper();
        // inform user, that the process has started
        res.send('fetching data from google started, this might take some minutes...');
    });

    /**
     * returns all positions that are currently available in the database
     * TODO: minimize data-output to needed
     */
    app.get("/positions", function (req, res) {

        TripModel.find({}, function(err, positions) {
            res.send(positions);
        });
    });
};



module.exports = appRouter;
