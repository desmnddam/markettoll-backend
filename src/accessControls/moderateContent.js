import { analyzeImageWithGoogleVision, extractTextWithGoogleVision, moderateTextWithOpenAI } from '../helpers/moderationHelpers.js';
import { nextError } from '../utils/index.js';
import fs from 'fs/promises';

// OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Middleware to moderate content (text and images) for product/service creation.
 * Expects req.body.description and req.files.images (array of images from multer).
 * Frontend sends images as "images" field in FormData.
 */
export default async function moderateContent(req, res, next) {

  try {
    const description = req.body.description || '';
    const name = req.body.name || '';
    const pickupAddress = req.body.pickupAddress || '';
    
    // Get images from req.files.images (multer field name)
    const images = req.files?.filter(t => t.fieldname === 'images');
    let allExtractedText = `${description} ${name} ${pickupAddress}`.trim();
    
    let moderationStatus = 'approved';
    let moderationReason = '';
    // 1. Analyze each image
    for (const img of images) {
      console.log("images", img);
      
      // img.buffer if using multer, otherwise read file
      // const buffer = img.buffer || (img.path ? await fs.readFile(img.path) : null);
      // if (!buffer) continue;

      // // SafeSearch
      // const safeSearchResult = await analyzeImageWithGoogleVision(buffer);
      // console.log("SafeSearchResult", safeSearchResult);

      // if (safeSearchResult?.isInappropriate) {
      //   moderationStatus = 'rejected';
      //   moderationReason = 'Inappropriate image content';
      //   break;
      // }

      // // OCR
      // const ocrText = await extractTextWithGoogleVision(buffer);
      // console.log("ocrText", ocrText);
      // if (ocrText) allExtractedText += ' ' + ocrText;
    }

    // 2. If not already rejected, check text moderation
    // if (moderationStatus === 'approved' && allExtractedText.trim()) {
    //   const textModeration = await moderateTextWithOpenAI(allExtractedText, OPENAI_API_KEY);
    //   console.log("textModeration", textModeration);
    //   if (textModeration.isInappropriate) {
    //     moderationStatus = 'rejected';
    //     moderationReason = 'Inappropriate text content';
    //   } else if (textModeration.flagged) {
    //     moderationStatus = 'pending_review';
    //     moderationReason = 'Text flagged for manual review';
    //   }
    // }

    // 3. Set moderation info for controller to use
    req.moderationStatus = moderationStatus;
    req.moderationReason = moderationReason;
    
    // 4. Only reject immediately if content is clearly inappropriate
    if (moderationStatus === 'rejected') {
      return nextError(next, 400, moderationReason);
    }
    
    // 5. For approved or pending_review, continue to controller
    next();
  } catch (err) {
    console.error('Moderation error:', err);
    return nextError(next, 500, 'Error during content moderation');
  }
} 