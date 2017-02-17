## Step 1: Turn on the Google Calendar API
1. Use [this wizard](https://console.developers.google.com/start/api?id=calendar) to create or select a project in the Google Developers Console and automatically turn on the API. Click **Continue**, then **Go to credentials**.
2. On the **Add credentials to your project page**, click the **Cancel** button.
3. At the top of the page, select the **OAuth consent screen** tab. Select an **Email address**, enter a **Product name** if not already set, and click the **Save** button.
4. Select the **Credentials** tab, click the **Create credentials** button and select **OAuth client ID**.
5. Select the application type **Other**, enter any name ("Gisela Test Google API"), and click the **Create** button.
6. Click **OK** to dismiss the resulting dialog.
7. Click the ![file_download](https://image.flaticon.com/icons/png/16/60/60721.png) (Download JSON) button to the right of the client ID.
8. Move this file to the `config/` directory and **rename** it to `client_secret.json`.

## Step 2: Get Google Geocode API Key
1. Follow the instructions from [https://developers.google.com/maps/documentation/geocoding/get-api-key?hl=en](https://developers.google.com/maps/documentation/geocoding/get-api-key?hl=en)
2. Write it down, save it, whatever. Just make sure, you can access it and don't have to rerun the whole process. Trust me, I've been there...

## Step 3: Install MongoDB
_In case you already installed mongoDB skip this step, otherwise:_
1. Download mongoDB Community Server for your OS [https://www.mongodb.com/download-center](https://www.mongodb.com/download-center)
2. Install it...
3. Run it
    * Windows: `"C:\Program Files\MongoDB\Server\3.4\bin\mongod.exe" --dbpath d:\test\mongodb\data`
    * Linux: google it for yourself :)
    
## Step 4: NodeJS Installation & Dependencies
1. Grab NodeJS LTS (untested for non-LTS): [https://nodejs.org/en/](https://nodejs.org/en/)
2. Clone this repo to your machine
3. Install dependencies with `npm install`

## Step 5: Configuration
1. Copy `config/options.example.js` and move it to `config/options.prod.js`
2. Edit `config/options.prod.js` with your previous defined
    * MongoDB Uri
    * Geocode API-Key
    * CalendarID (you will find this in Gisela --> Calendar Settings)
    
## Step 6: Run it!
1. Start the backend with `node app.js`, it will listen on `localhost:3000` per default.
2. On first run navigate to `http://localhost:3000/gcalfetch`. Then switch back to the bash where you started the backend, it will ask you to authenticate towards the calender with OAuth2. Copy the provided link from the console, navigate to it and paste the auth_code in the console once you are done. This has to be done once, afterwards your credentials are stored in your `config/` folder and you won't be asked again.




---
# API Definition
|  Endpoint  | Call-Parameter   | Type          | Response       |
| ---------- | :--------------: |:-------------:|:--------------:|
|`/gcalfetch`| `{}`             | `GET`         | `<String>`     |
|`/positions`| `{}`             | `GET`         | `Array<Object>`|

* `/gcalfetch`
    * Grabs all calendar items and stores its items in MongoDB
    * **Caution**: due to throttling this might take up to 5min!
    * returns a string, notifying the user, that the process was initiated
    
* `/positions`
    * returns all trips, including:
        ```javascript
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
        ```