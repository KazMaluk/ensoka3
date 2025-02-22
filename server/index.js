const express = require('express');
const cors = require('cors');
const { PublicKey, Connection } = require('@solana/web3.js');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const DEEPSEEK_API_KEY = 'sk-196a0273e4a74fba9c9fa75f51680e05';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const agentConfig = {
  name: 'Ensoka Wallet Analyst',
  personality: 'Concise, technical, crypto-savvy',
  task: 'Assist users in analyzing Solana wallets for memecoin copytrading',
};

app.post('/analyze', async (req, res) => {
  const { message, wallet: prevWallet, history } = req.body;

  try {
    let currentWallet = prevWallet;
    let balance, txs;

    // Check if the message contains a new wallet address
    const walletMatch = message.match(/[A-Za-z0-9]{32,44}/); // Rough Solana address regex
    if (walletMatch) {
      currentWallet = walletMatch[0];
      new PublicKey(currentWallet); // Validate
      balance = await connection.getBalance(new PublicKey(currentWallet));
      txs = await connection.getConfirmedSignaturesForAddress2(new PublicKey(currentWallet), { limit: 10 });
    }

    // Build Deepseek payload with history and context
    const deepseekPayload = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are ${agentConfig.name}, a ${agentConfig.personality} assistant. Your task is to ${agentConfig.task}. Respond conversationally. If a wallet is provided, analyze it and track it for follow-up questions. Current wallet: ${currentWallet || 'none yet'}.`
        },
        ...(history || []).map((msg) => ({ role: msg.role, content: msg.content })),
        {
          role: 'user',
          content: currentWallet
            ? `${message}\nWallet: ${currentWallet}, Balance: ${balance / 1e9} SOL, Recent Tx Count: ${txs?.length || 'unknown'}`
            : message,
        },
      ],
      max_tokens: 300,
    };

    const deepseekResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(deepseekPayload),
    });

    if (!deepseekResponse.ok) {
      throw new Error(`Deepseek API error: ${deepseekResponse.status}`);
    }

    const deepseekData = await deepseekResponse.json();
    const responseText = deepseekData.choices[0].message.content.trim();

    res.json({ response: responseText, wallet: currentWallet });
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({
      response: 'Sorry, I couldn’t process that. Try a valid Solana wallet or ask again!',
      wallet: prevWallet,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
