
import { config } from 'dotenv';
config();

// This file is used to register Genkit flows with the dev server.
import './flows/generate-chat-title';
import './flows/pollinations-chat-flow';
import './flows/stt-flow';
