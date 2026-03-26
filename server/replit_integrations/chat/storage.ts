export interface IChatStorage {
  getAllConversations(): Promise<any[]>;
  getConversation(id: number): Promise<any>;
  getMessagesByConversation(conversationId: number): Promise<any[]>;
  createConversation(data: any): Promise<any>;
  deleteConversation(id: number): Promise<void>;
  createMessage(conversationId: number, role: string, content: string): Promise<any>;
}
export const chatStorage: IChatStorage = {
  getAllConversations: async () => [],
  getConversation: async () => undefined,
  getMessagesByConversation: async () => [],
  createConversation: async (d) => d,
  deleteConversation: async () => {},
  createMessage: async (_c, _r, _m) => ({ id: 0, role: _r, content: _m }),
};
