import React, { useState } from 'react';
import './App.css';

function App() {
  const [wallet, setWallet] = useState('');
  const [results, setResults] = useState(null);

  const handlePaste = async (e) => {
    const pastedWallet = e.target.value;
    setWallet(pastedWallet);

    if (pastedWallet.length > 0) {
      try {
        const response = await fetch('https://ensoka-backend.up.railway.app/analyze', { // Update to your Railway URL
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: pastedWallet }),
        });
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error:', error);
        setResults({ error: 'Something went wrong!' });
      }
    }
  };

  return (
    <div className="App">
      <h1 className="ensoka-title">Ensoka</h1>
      <input
        className="wallet-input"
        placeholder="Paste Solana Wallet"
        value={wallet}
        onChange={handlePaste}
      />
      {results && (
        <div className="results">
          <p className="chat-bubble">
            Hey there! I’ve checked out that wallet for you. Here’s what I found:
          </p>
          <p><span>Reliability:</span> {results.reliability}</p>
          <p><span>Activity:</span> {results.activity}</p>
          <p><span>Safety:</span> {results.safety}</p>
          {results.error && <p className="error">{results.error}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
