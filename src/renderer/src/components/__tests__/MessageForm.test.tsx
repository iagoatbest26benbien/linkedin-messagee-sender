import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MessageForm from '../MessageForm';
import queueReducer from '../../store/slices/queueSlice';
import uiReducer from '../../store/slices/uiSlice';

const mockStore = configureStore({
  reducer: {
    queue: queueReducer,
    ui: uiReducer,
  },
});

describe('MessageForm', () => {
  const renderComponent = () => {
    return render(
      <Provider store={mockStore}>
        <MessageForm />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields correctly', () => {
    renderComponent();
    expect(screen.getByLabelText(/url du profil linkedin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ajouter à la file d'attente/i })).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    renderComponent();
    const urlInput = screen.getByLabelText(/url du profil linkedin/i);
    const messageInput = screen.getByLabelText(/message/i);
    const submitButton = screen.getByRole('button', { name: /ajouter à la file d'attente/i });

    fireEvent.change(urlInput, { target: { value: 'https://www.linkedin.com/in/test-user' } });
    fireEvent.change(messageInput, { target: { value: 'Hello, this is a test message' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/message ajouté à la file d'attente/i)).toBeInTheDocument();
    });

    // Check if form is reset
    expect(urlInput).toHaveValue('');
    expect(messageInput).toHaveValue('');
  });

  it('should show error message when submission fails', async () => {
    // Mock the store to simulate an error
    const mockStoreWithError = configureStore({
      reducer: {
        queue: (state = { error: 'Erreur d\'ajout' }, action) => state,
        ui: uiReducer,
      },
    });

    render(
      <Provider store={mockStoreWithError}>
        <MessageForm />
      </Provider>
    );

    const submitButton = screen.getByRole('button', { name: /ajouter à la file d'attente/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/erreur lors de l'ajout du message/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    // Mock the store to simulate loading state
    const mockStoreWithLoading = configureStore({
      reducer: {
        queue: (state = { loading: true }, action) => state,
        ui: uiReducer,
      },
    });

    render(
      <Provider store={mockStoreWithLoading}>
        <MessageForm />
      </Provider>
    );

    const submitButton = screen.getByRole('button', { name: /ajout.../i });
    expect(submitButton).toBeDisabled();
  });

  it('should validate LinkedIn URL format', () => {
    renderComponent();
    const urlInput = screen.getByLabelText(/url du profil linkedin/i);
    const submitButton = screen.getByRole('button', { name: /ajouter à la file d'attente/i });

    fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/url linkedin invalide/i)).toBeInTheDocument();
  });

  it('should require all fields', () => {
    renderComponent();
    const submitButton = screen.getByRole('button', { name: /ajouter à la file d'attente/i });

    fireEvent.click(submitButton);

    expect(screen.getByText(/url requise/i)).toBeInTheDocument();
    expect(screen.getByText(/message requis/i)).toBeInTheDocument();
  });

  it('should limit message length', () => {
    renderComponent();
    const messageInput = screen.getByLabelText(/message/i);
    const submitButton = screen.getByRole('button', { name: /ajouter à la file d'attente/i });

    const longMessage = 'a'.repeat(1001);
    fireEvent.change(messageInput, { target: { value: longMessage } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/le message ne doit pas dépasser 1000 caractères/i)).toBeInTheDocument();
  });
}); 