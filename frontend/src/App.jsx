import { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Wall from './components/Wall.jsx';
import WriteLetterFlow from './components/WriteLetterFlow.jsx';
import { t } from './i18n/translations.js';
import { shortenAddress } from './hooks/useContract.js';
import './styles/main.css';

export default function App() {
  const { authenticated, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [lang, setLang] = useState('en');
  const [showWriteFlow, setShowWriteFlow] = useState(false);
  const [wallKey, setWallKey] = useState(0);
  const [signer, setSigner] = useState(null);
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    if (!activeWallet?.address) return;
    navigator.clipboard.writeText(activeWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Only use an external wallet (MetaMask) if it is actually linked to the
  // current Privy user's account — prevents another user's MetaMask from
  // leaking owner privileges into a different email session.
  const linkedAddresses = new Set(
    (user?.linkedAccounts ?? [])
      .filter((a) => a.type === 'wallet')
      .map((a) => a.address?.toLowerCase())
  );

  const activeWallet =
    wallets.find((w) => w.walletClientType !== 'privy' && linkedAddresses.has(w.address?.toLowerCase())) ||
    wallets.find((w) => w.walletClientType === 'privy');

  const refreshSigner = useCallback(async () => {
    if (!activeWallet) { setSigner(null); return; }
    try {
      const provider = await activeWallet.getEthersProvider();
      setSigner(await provider.getSigner());
    } catch {
      setSigner(null);
    }
  }, [activeWallet]);

  useEffect(() => {
    refreshSigner();
  }, [refreshSigner]);

  return (
    <>
      <header className="site-header">
        <div className="header-inner container">
          <nav className="header-nav">
            <button
              className="lang-toggle"
              onClick={() => setLang((l) => (l === 'en' ? 'my' : 'en'))}
            >
              {t(lang, 'langToggle')}
            </button>

            {authenticated && activeWallet && (
              <div className="header-nav-right">
                <button className="wallet-badge" onClick={copyAddress} title="Click to copy full address">
                  {copied ? '✓ Copied!' : shortenAddress(activeWallet.address)}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={logout}>
                  Sign out
                </button>
              </div>
            )}
          </nav>

          <h1 className="header-title">{t(lang, 'headerTitle')}</h1>
          <p className="header-subtitle">{t(lang, 'headerSubtitle')}</p>
          <p className="header-tagline">{t(lang, 'headerTagline')}</p>

          <div className="header-cta">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setShowWriteFlow(true)}
            >
              ✉️ {t(lang, 'leaveLetterBtn')}
            </button>
          </div>
        </div>
      </header>

      <main>
        <Wall
          key={wallKey}
          lang={lang}
          connectedAddress={activeWallet?.address}
          signer={signer}
        />
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>{t(lang, 'footerText')}</p>
          <p>{t(lang, 'footerBlockchain')}</p>
        </div>
      </footer>

      {showWriteFlow && (
        <WriteLetterFlow
          lang={lang}
          onClose={() => setShowWriteFlow(false)}
          onSuccess={() => {
            setWallKey((k) => k + 1);
            setShowWriteFlow(false);
          }}
        />
      )}
    </>
  );
}
