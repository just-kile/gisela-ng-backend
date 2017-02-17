var options = {
    // *** MONGO DATABASE ***
    mongoDB: {
        // define mongoDB server url
        mongoUrl: 'mongodb://localhost/gisela-db'
    },

    // *** GOOGLE SERVICE ***
    google: {
        // Geocode API Key
        apiKey: 'INSERT_YOUR_GEOCODE_API_KEY_HERE',
        // Calendar ID of Gisela
        calendarId: 'GISELA_CALENDAR_ID@group.calendar.google.com',
        // Grab all trips starting from:
        queryStartDate: '2014-01-01T00:00:00+00:00'
    }
};

module.exports = options;
