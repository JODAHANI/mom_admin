import { useState } from 'react';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createGlobalStyle } from 'styled-components';
import { useWebSocketOrders } from '../hooks/useOrders';
import { ToastProvider, useToast } from '../components/Toast';

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      'Helvetica Neue', Arial, sans-serif;
    background: #F5F6F8;
    color: #1B1D1F;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  @media print {
    body > * {
      visibility: hidden;
    }
    #qr-print-area, #qr-print-area * {
      visibility: visible;
    }
    #qr-print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 24px;
      padding: 20px;
    }
  }

  button {
    font-family: inherit;
  }

  input, textarea, select {
    font-family: inherit;
  }
`;

function WebSocketProvider({ children }) {
  const showToast = useToast();
  useWebSocketOrders(showToast);
  return children;
}

export default function App({ Component, pageProps }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>장유해신탕 관리자</title>
      </Head>
      <GlobalStyle />
      <ToastProvider>
        <WebSocketProvider>
          <Component {...pageProps} />
        </WebSocketProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
