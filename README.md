# Feel the AQI

A simple web application that shows the Air Quality Index (AQI) for your current location.

## Features

- Gets your current location using the browser's Geolocation API
- Fetches real-time AQI data from the World Air Quality Index (WAQI) API
- Displays AQI value, status, and location information
- Color-coded AQI values based on severity
- Responsive design that works on both desktop and mobile

## Setup

1. Get your API token from [WAQI](https://aqicn.org/api/)
2. Replace the `TOKEN` variable in `app.js` with your API token
3. Open `index.html` in a web browser
4. Allow location access when prompted

## Note

The demo token has limited functionality. For production use, please get your own token from WAQI.
