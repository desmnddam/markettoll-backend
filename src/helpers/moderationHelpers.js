import axios from 'axios';
import fs from 'fs/promises';
import { GoogleAuth } from 'google-auth-library';
import { GCPServiceAccountObject } from '../files/index.js';

// Initialize Google Auth with service account
const auth = new GoogleAuth({
  credentials: GCPServiceAccountObject,
  scopes: ['https://www.googleapis.com/auth/cloud-vision']
});

// Google Vision API helpers using service account
export async function analyzeImageWithGoogleVision(imageBuffer) {
  console.log("DSJSLFJDSLKFJSDJFKLSDJFSF", imageBuffer);
  
  try {
    const base64Image = imageBuffer.toString('base64');
    const url = 'https://vision.googleapis.com/v1/images:annotate';
    const requestBody = {
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: 'SAFE_SEARCH_DETECTION' }],
        },
      ],
    };

    // Get access token using service account
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    try {
      const response = await axios.post(url, requestBody, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      }
      });
      const safeSearch = response.data.responses[0].safeSearchAnnotation;
      // You can adjust thresholds as needed
      const isInappropriate =
        safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY' ||
        safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY' ||
        safeSearch.racy === 'LIKELY' || safeSearch.racy === 'VERY_LIKELY';
      
      return { isInappropriate, safeSearch };
    } catch (error) {
        if (error.response?.status === 403) {
          const message = error.response.data.error?.message;
          if (message?.includes('Billing')) {
            console.error('❌ Google Vision billing not enabled.');
          } else {
            console.error('❌ Google Vision permission error:', message);
          }
        } else {
          console.error('❌ Vision API call failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Google Vision SafeSearch error:', error);
    throw error;
  }
}

export async function extractTextWithGoogleVision(imageBuffer) {
  try {
    const base64Image = imageBuffer.toString('base64');
    const url = 'https://vision.googleapis.com/v1/images:annotate';
    const requestBody = {
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: 'TEXT_DETECTION' }],
        },
      ],
    };

    // Get access token using service account
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    const response = await axios.post(url, requestBody, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      }
    });

    const textAnnotations = response.data.responses[0].textAnnotations;
    if (textAnnotations && textAnnotations.length > 0) {
      return textAnnotations[0].description;
    }
    return '';
  } catch (error) {
    console.error('Google Vision OCR error:', error);
    throw error;
  }
}

// OpenAI Moderation API helper
export async function moderateTextWithOpenAI(text, openaiApiKey) {
  const url = 'https://api.openai.com/v1/moderations';
  const response = await axios.post(
    url,
    { input: text },
    { headers: { Authorization: `Bearer ${openaiApiKey}` } }
  );
  const result = response.data.results[0];
  const isInappropriate = result.flagged;
  // You can check result.categories for more details
  return { isInappropriate, categories: result.categories, flagged: result.flagged };
}