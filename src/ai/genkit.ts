'use server';

/**
 * @fileoverview Centralized Genkit configuration.
 * This file initializes and configures the genkitAI object that is used
 * across the application to define flows, models, and other Genkit functionalities.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// This allows the use of Google's AI models like Gemini.
export const ai = genkit({
  plugins: [
    googleAI({
      // The API key is automatically sourced from the `GEMINI_API_KEY`
      // environment variable. Make sure this is set in your .env file.
    }),
  ],
  // Log all traces to the console for debugging purposes.
  // In a production environment, you might want to configure a different logger.
  logSinks: ['json'],
  // Prevent telemetry data from being sent to Google.
  telemetry: {
    instrumentation: false,
  },
});
