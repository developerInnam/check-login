const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const app = express();
const PORT = process.env.PORT || 3001;

dotenv.config(); // Load environment variables from .env

app.use(express.json()); // To parse JSON request bodies
app.use(express.static('public')); // Serve your frontend HTML file (if in 'public' folder)

// CORS protection (important for development, adjust for production)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins for simplicity in dev
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Endpoint to receive the Facebook Access Token from the client
app.post('/api/facebook-auth', async (req, res) => {
    const { accessToken, userID } = req.body;

    if (!accessToken || !userID) {
        return res.status(400).json({ error: 'Access token and User ID are required.' });
    }

    try {
        // 1. Exchange short-lived token for a long-lived one (Highly Recommended!)
        // This makes the token valid for 60 days instead of hours.
        const longLivedTokenResponse = await axios.get(
            `https://graph.facebook.com/v19.0/oauth/access_token?` +
            `grant_type=fb_exchange_token&` +
            `client_id=${process.env.FACEBOOK_APP_ID}&` +
            `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
            `fb_exchange_token=${accessToken}`
        );

        const longLivedAccessToken = longLivedTokenResponse.data.access_token;
        console.log('Exchanged for long-lived access token:', longLivedAccessToken.substring(0, 30) + '...');

        // 2. Store this longLivedAccessToken associated with the userID in your CRM database.
        // This allows your CRM to access the client's ad data later without re-login.
        // Example: await saveUserTokenToDatabase(userID, longLivedAccessToken);

        res.json({ message: 'Facebook authentication successful. Token exchanged and ready for backend use.', longLivedAccessToken });

    } catch (error) {
        console.error('Error during Facebook token exchange:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to authenticate with Facebook.', details: error.response ? error.response.data : error.message });
    }
});

// Endpoint to fetch ad leads (requires a valid long-lived access token for the client)
app.get('/api/facebook-leads/:adAccountId', async (req, res) => {
    const { adAccountId } = req.params;
    // In a real CRM, you'd fetch the client's long-lived access token from your database
    // associated with the currently logged-in CRM user.
    // For this example, let's assume you've already retrieved it.
    // For demonstration, let's use a dummy token, replace with real logic:
    const clientAccessToken = 'YOUR_STORED_CLIENT_LONG_LIVED_ACCESS_TOKEN_FOR_THIS_CLIENT'; // REPLACE THIS WITH ACTUAL DB RETRIEVAL

    if (!clientAccessToken) {
        return res.status(401).json({ error: 'Client access token not found. Please log in through Facebook.' });
    }

    try {
        // First, get lead forms associated with the ad account or page
        // You might need to iterate through pages associated with the user/ad account
        // and then get their lead forms. For simplicity, let's try a direct leads endpoint.

        // More accurate approach:
        // 1. Get pages managed by the user: /me/accounts with clientAccessToken
        // 2. For each page, get lead forms: /PAGE_ID/leadgen_forms
        // 3. For each lead form, get leads: /LEAD_FORM_ID/leads

        // For simplicity, let's assume we know a lead form ID or fetch from ad account
        // THIS IS A SIMPLIFIED EXAMPLE. Actual lead retrieval is more complex.
        // You'll need to know the specific Lead Form ID or Page ID for leads.
        // You might list ad accounts first: /me/adaccounts
        // Then iterate ad accounts for lead forms.

        // Example: Fetching leads for a specific lead form (replace LEAD_FORM_ID)
        // You would typically get the LEAD_FORM_ID from a previous API call or from your CRM configuration.
        const leadFormId = 'YOUR_LEAD_FORM_ID'; // Example, replace with actual ID
        const leadsResponse = await axios.get(
            `https://graph.facebook.com/v19.0/${leadFormId}/leads?access_token=${clientAccessToken}`
        );

        res.json(leadsResponse.data);

    } catch (error) {
        console.error('Error fetching Facebook Ads leads:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch Facebook Ads leads.', details: error.response ? error.response.data : error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser.`);
});