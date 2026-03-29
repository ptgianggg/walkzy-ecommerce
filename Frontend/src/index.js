import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'antd/dist/reset.css';
import { Provider } from 'react-redux';
import { persistor, store } from './redux/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistGate } from 'redux-persist/integration/react';

// Google OAuth Provider
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút - data vẫn fresh trong 5 phút
      cacheTime: 10 * 60 * 1000, // 10 phút - giữ cache 10 phút sau khi không dùng
      refetchOnWindowFocus: false, // Không refetch khi focus window
      refetchOnMount: false, // Chỉ refetch nếu data stale
      retry: 1, // Chỉ retry 1 lần khi lỗi
      retryDelay: 1000,
    },
  },
});

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '113955710962-r36koap4ll7q1m27t4i79ve1r83mso5d.apps.googleusercontent.com';

root.render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

reportWebVitals();
