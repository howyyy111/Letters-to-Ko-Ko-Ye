import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { sepolia } from 'viem/chains';
import App from './App.jsx';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

createRoot(document.getElementById('root')).render(
  <PrivyProvider
    appId={PRIVY_APP_ID}
    config={{
      loginMethods: ['email', 'google', 'wallet'],
      defaultChain: sepolia,
      supportedChains: [sepolia],
      appearance: {
        theme: 'light',
        accentColor: '#D4A017',
        logo: '',
      },
      embeddedWallets: {
        createOnLogin: 'users-without-wallets',
        noPromptOnSignature: false,
      },
    }}
  >
    <App />
  </PrivyProvider>
);
