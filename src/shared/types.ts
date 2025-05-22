// Types pour les identifiants LinkedIn
export interface LinkedInCredentials {
  email: string;
  password: string;
}

// Types pour les messages
export interface Message {
  id: string;
  recipientUrl: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export enum MessageStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
}

// Types pour les événements IPC
export interface IpcEvents {
  'get-credentials': () => Promise<LinkedInCredentials | null>;
  'save-credentials': (credentials: LinkedInCredentials) => Promise<void>;
  'get-messages': () => Promise<Message[]>;
  'add-message': (message: Omit<Message, 'id' | 'status' | 'createdAt'>) => Promise<Message>;
  'clear-queue': () => Promise<void>;
  'start-queue': () => Promise<void>;
  'stop-queue': () => Promise<void>;
  'get-queue-status': () => Promise<QueueStatus>;
}

// Types pour les réponses IPC
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Types pour le statut du serveur
export interface ServerStatus {
  isRunning: boolean;
  port?: number;
  lastError?: string;
}

// Types pour le statut de la file d'attente
export interface QueueStatus {
  isRunning: boolean;
  queueLength: number;
  processedCount: number;
  failedCount: number;
  lastProcessed: string | null;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

export interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  selectedTab: string;
  notifications: Notification[];
}

export interface CredentialsState {
  credentials: LinkedInCredentials | null;
  loading: boolean;
  error: string | null;
}

export interface QueueState {
  messages: Message[];
  status: QueueStatus;
  loading: boolean;
  error: string | null;
}

export interface RootState {
  credentials: CredentialsState;
  queue: QueueState;
  ui: UIState;
}

// Types pour les erreurs
export class LinkedInError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LinkedInError';
  }
}

export const ErrorCodes = {
  AUTH_FAILED: 'AUTH_FAILED',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  MESSAGE_FAILED: 'MESSAGE_FAILED',
  QUEUE_ERROR: 'QUEUE_ERROR',
} as const;

// Types pour les configurations
export interface AppConfig {
  maxRetries: number;
  retryDelay: number;
  minDelay: number;
  maxDelay: number;
  processInterval: number;
  timeout: number;
}

export const defaultConfig: AppConfig = {
  maxRetries: 3,
  retryDelay: 5000,
  minDelay: 30000,
  maxDelay: 60000,
  processInterval: 5000,
  timeout: 30000,
}; 