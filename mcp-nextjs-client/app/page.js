// MCPClient.jsx
'use client';

import { useState } from 'react';

export default function MCPClient() {
  const [numbersInput, setNumbersInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Initialize MCP session
  const initializeSession = async () => {
    setLoading(true);
    const response = await fetch('http://localhost:7171/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': '2025-06-18'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'mcp/initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {}
        }
      })
    });

    const newSessionId = response.headers.get('mcp-session-id');
    setSessionId(newSessionId);
    setLoading(false);
    alert(`Session initialized: ${newSessionId}`);
  };

  // Step 2: Call calculate-sum tool
  const calculateSum = async () => {
    if (!sessionId) {
      alert('Session not initialized. Click "Initialize Session" first.');
      return;
    }

    const numbers = numbersInput.split(',').map(Number).filter(n => !isNaN(n));

    const response = await fetch('http://localhost:7171/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': '2025-06-18',
        'MCP-Session-Id': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'mcp/callTool',
        params: {
          tool: 'calculate-sum',
          input: { numbers }
        }
      })
    });

    const data = await response.json();
    const content = data?.result?.content?.find(c => c.type === 'text')?.text;
    setResult(content);
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 bg-white shadow-xl rounded-xl space-y-4">
      <h1 className="text-xl font-bold text-center">🧠 MCP Sum Agent</h1>

      <button
        onClick={initializeSession}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
      >
        Initialize Session
      </button>

      <input
        type="text"
        placeholder="Enter numbers, e.g., 1, 2, 3"
        value={numbersInput}
        onChange={e => setNumbersInput(e.target.value)}
        className="w-full p-2 border rounded text-sm"
      />

      <button
        onClick={calculateSum}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
      >
        Calculate Sum
      </button>

      {result && (
        <div className="bg-gray-100 p-4 rounded text-center">
          <strong>Result:</strong> {result}
        </div>
      )}
    </div>
  );
}
