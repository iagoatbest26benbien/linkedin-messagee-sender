import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MessageQueue from '../MessageQueue';
import queueReducer from '../../store/slices/queueSlice';
import uiReducer from '../../store/slices/uiSlice';
import { MessageStatus } from '../../../shared/types';

const mockMessages = [
  {
    id: '1',
    recipientUrl: 'https://www.linkedin.com/in/user1',
    content: 'Message 1',
    status: MessageStatus.PENDING,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    recipientUrl: 'https://www.linkedin.com/in/user2',
    content: 'Message 2',
    status: MessageStatus.SENT,
    createdAt: new Date().toISOString(),
  },
];

const mockQueueStatus = {
  isRunning: false,
  queueLength: 1,
  processedCount: 1,
  failedCount: 0,
};

const mockStore = configureStore({
  reducer: {
    queue: (state = {
      messages: mockMessages,
      status: mockQueueStatus,
      loading: false,
      error: null,
    }, action) => state,
    ui: uiReducer,
  },
});

describe('MessageQueue', () => {
  const renderComponent = () => {
    return render(
      <Provider store={mockStore}>
        <MessageQueue />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render queue status correctly', () => {
    renderComponent();
    expect(screen.getByText(/en attente: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/envoyés: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/échecs: 0/i)).toBeInTheDocument();
  });

  it('should render messages table correctly', () => {
    renderComponent();
    expect(screen.getByText(/url du destinataire/i)).toBeInTheDocument();
    expect(screen.getByText(/message/i)).toBeInTheDocument();
    expect(screen.getByText(/statut/i)).toBeInTheDocument();
    expect(screen.getByText(/date de création/i)).toBeInTheDocument();

    mockMessages.forEach(message => {
      expect(screen.getByText(message.recipientUrl)).toBeInTheDocument();
      expect(screen.getByText(message.content)).toBeInTheDocument();
    });
  });

  it('should show empty state when no messages', () => {
    const emptyStore = configureStore({
      reducer: {
        queue: (state = {
          messages: [],
          status: { ...mockQueueStatus, queueLength: 0, processedCount: 0 },
          loading: false,
          error: null,
        }, action) => state,
        ui: uiReducer,
      },
    });

    render(
      <Provider store={emptyStore}>
        <MessageQueue />
      </Provider>
    );

    expect(screen.getByText(/aucun message dans la file d'attente/i)).toBeInTheDocument();
  });

  it('should handle start queue action', async () => {
    const mockDispatch = jest.fn();
    const storeWithDispatch = configureStore({
      reducer: {
        queue: (state = {
          messages: mockMessages,
          status: mockQueueStatus,
          loading: false,
          error: null,
        }, action) => {
          mockDispatch(action);
          return state;
        },
        ui: uiReducer,
      },
    });

    render(
      <Provider store={storeWithDispatch}>
        <MessageQueue />
      </Provider>
    );

    const startButton = screen.getByRole('button', { name: /démarrer/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'queue/startQueue',
      }));
    });
  });

  it('should handle stop queue action', async () => {
    const mockDispatch = jest.fn();
    const storeWithDispatch = configureStore({
      reducer: {
        queue: (state = {
          messages: mockMessages,
          status: { ...mockQueueStatus, isRunning: true },
          loading: false,
          error: null,
        }, action) => {
          mockDispatch(action);
          return state;
        },
        ui: uiReducer,
      },
    });

    render(
      <Provider store={storeWithDispatch}>
        <MessageQueue />
      </Provider>
    );

    const stopButton = screen.getByRole('button', { name: /arrêter/i });
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'queue/stopQueue',
      }));
    });
  });

  it('should handle refresh action', async () => {
    const mockDispatch = jest.fn();
    const storeWithDispatch = configureStore({
      reducer: {
        queue: (state = {
          messages: mockMessages,
          status: mockQueueStatus,
          loading: false,
          error: null,
        }, action) => {
          mockDispatch(action);
          return state;
        },
        ui: uiReducer,
      },
    });

    render(
      <Provider store={storeWithDispatch}>
        <MessageQueue />
      </Provider>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'queue/getMessages',
      }));
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'queue/getQueueStatus',
      }));
    });
  });

  it('should show loading state', () => {
    const loadingStore = configureStore({
      reducer: {
        queue: (state = {
          messages: mockMessages,
          status: mockQueueStatus,
          loading: true,
          error: null,
        }, action) => state,
        ui: uiReducer,
      },
    });

    render(
      <Provider store={loadingStore}>
        <MessageQueue />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /démarrer/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeDisabled();
  });

  it('should show error message', () => {
    const errorStore = configureStore({
      reducer: {
        queue: (state = {
          messages: mockMessages,
          status: mockQueueStatus,
          loading: false,
          error: 'Une erreur est survenue',
        }, action) => state,
        ui: uiReducer,
      },
    });

    render(
      <Provider store={errorStore}>
        <MessageQueue />
      </Provider>
    );

    expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();
  });
}); 