import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/query/queryClient';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { EntitlementProvider } from './contexts/EntitlementContext';
import { TransactionsProvider } from './contexts/TransactionsContext';
import { DebtProvider } from './contexts/DebtContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>
            <EntitlementProvider>
            <NotificationProvider>
              <TransactionsProvider>
                <DebtProvider>
                  <FinanceProvider>
                    <App />
                  </FinanceProvider>
                </DebtProvider>
              </TransactionsProvider>
            </NotificationProvider>
            </EntitlementProvider>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
