
import { config } from 'dotenv';
config();

// This file is used to register Genkit flows with the dev server.

// New central agent flow
import './flows/agent-chat-flow';

// Existing flows (will be phased out)
import './flows/stt-flow';
import './flows/tts-flow';
