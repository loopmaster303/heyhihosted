import { ChatService } from '@/lib/services/chat-service';
import { DatabaseService } from '@/lib/services/database';

describe('Chat Smoke Test', () => {
  it('should have ChatService defined', () => {
    expect(ChatService).toBeDefined();
  });

  it('should have DatabaseService defined', () => {
    expect(DatabaseService).toBeDefined();
  });

  it('should contain expected methods in ChatService', () => {
    expect(typeof ChatService.sendChatCompletion).toBe('function');
    expect(typeof ChatService.generateImage).toBe('function');
  });
});
