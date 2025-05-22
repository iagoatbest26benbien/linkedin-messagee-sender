import Store from 'electron-store';
import { LinkedInCredentials } from '../../shared/types';

class StorageService {
  private credentialsStore: Store;

  constructor() {
    this.credentialsStore = new Store({
      name: 'credentials',
      encryptionKey: 'your-encryption-key', // À remplacer par une clé sécurisée
      schema: {
        credentials: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            password: { type: 'string' }
          },
          required: ['email', 'password']
        }
      }
    });
  }

  async saveCredentials(credentials: LinkedInCredentials): Promise<void> {
    await this.credentialsStore.set('credentials', credentials);
  }

  async getCredentials(): Promise<LinkedInCredentials | null> {
    const credentials = await this.credentialsStore.get('credentials');
    return credentials as LinkedInCredentials || null;
  }

  async clearCredentials(): Promise<void> {
    await this.credentialsStore.delete('credentials');
  }
}

export const storageService = new StorageService(); 