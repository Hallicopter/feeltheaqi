import { generateAQIInsights } from './gemini.js';

// WAQI API token - You'll need to replace this with your own token from https://aqicn.org/api/
const TOKEN = 'e885eed4a62b607453017245e897dd5bddb4e01d';
const WAQI_API_URL = 'https://api.waqi.info/feed/geo:';

// DOM Elements
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const resultElement = document.getElementById('result');
const aqiValueElement = document.getElementById('aqi-value');
const locationElement = document.getElementById('location');
const coordinatesElement = document.getElementById('coordinates');
const stationDistanceElement = document.getElementById('station-distance');
const aqiStatusElement = document.getElementById('aqi-status');
const lastUpdatedElement = document.getElementById('last-updated');
const aiModelStatus = document.getElementById('ai-model-status');
const askExpertButton = document.getElementById('ask-expert');
const aiInsightsContainer = document.getElementById('ai-insights-container');
const aiLoadingElement = document.getElementById('ai-loading');
const aiInsightsElement = document.getElementById('ai-insights');

// Track current AQI data
let currentAQIData = null;

// Initialize button state
let isGeneratingInsights = false;

// Start loading AQI data immediately
refreshAQI();

// Handle expert button click
askExpertButton.addEventListener('click', async () => {
    if (!currentAQIData || isGeneratingInsights) return;
    
    const { aqi, category } = currentAQIData;
    isGeneratingInsights = true;
    
    // Update UI to show loading state
    aiInsightsContainer.style.display = 'block';
    aiLoadingElement.style.display = 'block';
    aiInsightsElement.style.display = 'block';
    aiInsightsElement.textContent = '';
    askExpertButton.disabled = true;
    
    try {
        const insights = await generateAQIInsights(aqi, category);
        
        // Display insights with typing effect and markdown rendering
        let currentText = '';
        let i = 0;
        const typingEffect = setInterval(() => {
            if (i < insights.length) {
                currentText += insights.charAt(i);
                // Render markdown as we type
                aiInsightsElement.innerHTML = marked.parse(currentText);
                i++;
            } else {
                clearInterval(typingEffect);
                aiLoadingElement.style.display = 'none';
                askExpertButton.disabled = false;
                isGeneratingInsights = false;
            }
        }, 20);
    } catch (error) {
        aiInsightsElement.textContent = 'Sorry, I had trouble analyzing the AQI data. Please try again.';
        aiLoadingElement.style.display = 'none';
        askExpertButton.disabled = false;
        isGeneratingInsights = false;
    }
});

// AQI Status categories
const AQI_CATEGORIES = [
    { max: 50, status: 'Good', color: '#00e400' },
    { max: 100, status: 'Moderate', color: '#ffff00' },
    { max: 150, status: 'Unhealthy for Sensitive Groups', color: '#ff7e00' },
    { max: 200, status: 'Unhealthy', color: '#ff0000' },
    { max: 300, status: 'Very Unhealthy', color: '#99004c' },
    { max: Infinity, status: 'Hazardous', color: '#7e0023' }
];

function showError(message) {
    loadingElement.style.display = 'none';
    errorElement.style.display = 'block';
    resultElement.style.display = 'none';
    errorElement.querySelector('p').textContent = message;
}

function showLoading() {
    loadingElement.style.display = 'block';
    errorElement.style.display = 'none';
    resultElement.style.display = 'none';
}

function showResult() {
    loadingElement.style.display = 'none';
    errorElement.style.display = 'none';
    resultElement.style.display = 'block';
}

function getAQICategory(aqi) {
    return AQI_CATEGORIES.find(category => aqi <= category.max);
}

async function getAQIData(latitude, longitude) {
    try {
        const response = await fetch(`${WAQI_API_URL}${latitude};${longitude}/?token=${TOKEN}`);
        if (!response.ok) throw new Error('Failed to fetch AQI data');
        
        const data = await response.json();
        if (data.status !== 'ok') throw new Error(data.data);
        
        return data.data;
    } catch (error) {
        throw new Error('Could not fetch AQI data: ' + error.message);
    }
}

// Function to calculate distance between two points in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}



async function updateAQIDisplay(latitude, longitude) {
    try {
        // Log coordinates for debugging
        console.log('Coordinates from browser:', { latitude, longitude });
        showLoading();
        
        const data = await getAQIData(latitude, longitude);
        const aqi = data.aqi;
        const category = getAQICategory(aqi);
        
        // Calculate distance to monitoring station
        const stationLat = data.city.geo[0];
        const stationLon = data.city.geo[1];
        const distance = calculateDistance(latitude, longitude, stationLat, stationLon);
        
        aqiValueElement.textContent = aqi;
        aqiValueElement.style.color = category.color;
        locationElement.textContent = data.city.name;
        coordinatesElement.textContent = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
        stationDistanceElement.textContent = `${distance.toFixed(1)} km away`;
        aqiStatusElement.textContent = category.status;
        lastUpdatedElement.textContent = new Date(data.time.iso).toLocaleString();
        
        // Store current AQI data for expert advice
        currentAQIData = { aqi, category };
        
        // Enable ask expert button
        askExpertButton.disabled = false;
        
        showResult();
    } catch (error) {
        showError(error.message);
    }
}

function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

async function refreshAQI() {
    try {
        const position = await getLocation();
        await updateAQIDisplay(position.coords.latitude, position.coords.longitude);
    } catch (error) {
        showError(error.message);
    }
}

// No need to call refreshAQI() here since it's called in initialize()
