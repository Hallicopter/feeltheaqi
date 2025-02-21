// Security settings
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_PER_DAY = 100;
const COOLDOWN_MS = 2000; // Minimum time between requests

// API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// To people trying to use my key, I have rate limited it on the server API config on gemini. Please use your own key. This is useless.
// This doesn't have any payment associated with it. I am saving you time.

const _k1 = 'AIzaSyAMfGBH8R1fv';
const _k2 = '_PyWdNGuDWv_SO';
const _k3 = 'IL_v2JHk';



class APISecurityManager {
    constructor() {
        this.lastRequestTime = 0;
        this.initializeStorage();
    }

    initializeStorage() {
        // Initialize or reset daily counters at midnight
        const now = new Date();
        const lastReset = localStorage.getItem('geminiLastReset');
        const today = now.toDateString();
        
        if (lastReset !== today) {
            localStorage.setItem('geminiDailyCount', '0');
            localStorage.setItem('geminiLastReset', today);
        }

        // Initialize minute-based counter
        if (!localStorage.getItem('geminiMinuteRequests')) {
            localStorage.setItem('geminiMinuteRequests', JSON.stringify([]));
        }
    }

    getApiKey() {
        return `${_k1}${_k2}${_k3}`;
    }

    async validateRequest() {
        const now = Date.now();
        
        // Check cooldown
        if (now - this.lastRequestTime < COOLDOWN_MS) {
            throw new Error(`Please wait ${COOLDOWN_MS/1000} seconds between requests.`);
        }

        // Check daily limit
        const dailyCount = parseInt(localStorage.getItem('geminiDailyCount') || '0');
        if (dailyCount >= RATE_LIMIT_PER_DAY) {
            throw new Error('Daily request limit reached. Please try again tomorrow.');
        }

        // Check per-minute limit
        const minuteRequests = JSON.parse(localStorage.getItem('geminiMinuteRequests') || '[]');
        const oneMinuteAgo = now - 60000;
        const recentRequests = minuteRequests.filter(time => time > oneMinuteAgo);
        
        if (recentRequests.length >= RATE_LIMIT_PER_MINUTE) {
            throw new Error('Too many requests. Please wait a minute.');
        }

        // Update counters
        this.lastRequestTime = now;
        localStorage.setItem('geminiDailyCount', (dailyCount + 1).toString());
        recentRequests.push(now);
        localStorage.setItem('geminiMinuteRequests', JSON.stringify(recentRequests));

        return true;
    }
}

const securityManager = new APISecurityManager();

async function generateAQIInsights(aqi, category) {
    try {
        const prompt = `As an air quality expert, analyze this AQI reading:
            - AQI Value: ${aqi}
            
            Provide a brief, practical analysis including:
            1. What this AQI means for health (explain AQI here, and the science behind it. How it's calculated, and the health issues it can caused based on exposure duration and numbers.)
            2. Who should take precautions
            3. Recommended actions
            
            Think logically like a leading AQI expert, and provide clear practical comparisions and resources to learn more, as well as giving a sense of what good AQI looks like.
            Respond in pure nicely formatted markdown. Don't yap, start the answer.
            `;

        await securityManager.validateRequest();
        
        const response = await fetch(`${GEMINI_API_URL}?key=${securityManager.getApiKey()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('No valid response from Gemini API');
        }
    } catch (error) {
        console.error('Error generating insights:', error);
        throw error;
    }
}

export { generateAQIInsights };
