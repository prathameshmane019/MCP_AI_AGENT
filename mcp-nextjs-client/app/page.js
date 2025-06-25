"use client"; // Required for Next.js 13+ to enable client-side rendering
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Main App component for the MCP Chatbot Client
function App() {
  // State to store chat messages (user, bot, notifications)
  const [messages, setMessages] = useState([]);
  // State for the current input field value
  const [input, setInput] = useState('');
  // State for the MCP session ID received from the server
  const [sessionId, setSessionId] = useState(null);
  // State to indicate if an API call is in progress
  const [isLoading, setIsLoading] = useState(false);
  // State to store any API errors
  const [error, setError] = useState(null);
  // State for the last event ID received from SSE, for resumability
  const [lastEventId, setLastEventId] = useState(0);
  // Ref to hold the EventSource instance for SSE management
  const eventSourceRef = useRef(null);
  // Ref for scrolling to the latest message in the chat window
  const chatEndRef = useRef(null);

  // Base URL for your MCP server.
  // IMPORTANT: Replace with your actual server URL if different.
  const MCP_SERVER_BASE_URL = 'http://localhost:3001/mcp';

  // Function to scroll the chat window to the bottom, showing the latest message
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect hook to scroll to bottom whenever the messages state updates
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Callback function to add a new message to the chat history
  // Uses useCallback to prevent unnecessary re-renders of child components if passed down
  const addMessage = useCallback((sender, text, type = 'text') => {
    setMessages(prevMessages => [
      ...prevMessages,
      { id: Date.now(), sender, text, type } // Unique ID for each message
    ]);
  }, []); // No dependencies, so it's stable across renders

  // Function to initialize a new MCP session with the server
  const initializeSession = useCallback(async () => {
    setIsLoading(true); // Set loading state
    setError(null); // Clear any previous errors
    try {
      addMessage('System', 'Initializing new session...'); // Notify user of initialization
      const response = await fetch(MCP_SERVER_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream', // Explicitly set Accept header for SSE
        },
        body: JSON.stringify({
          jsonrpc: '2.0', 
          method: 'initialize',
          params: {
            capabilities: {
              tools: true,
              prompts: false,
              resources: false,
              logging: false,
              roots: { listChanged: false }
            }, protocolVersion: "2025-03-26", clientInfo: { name: 'mcp-chatbot-client', version: "1.0.0" }
          },
          id: 1, // Unique request ID for this RPC call
        }),
      });

      const data = await response.json(); // Parse the JSON response 
      console.log(response);
      console.log(response.headers['MCP-Session-Id']);
      // Check if the response was successful and contains a session ID
      if (response.ok) {
        setSessionId( "b71cbb5d-adc5-4fcf-9269-d146696e09ae"); // Store the session ID
        addMessage('System', `Session initialized: ${sessionId}`);
        return sessionId; // Return session ID for further use (e.g., SSE setup)
      } else {
        // Handle specific server initialization error
        if (data.error?.message.includes('Server not initialized')) {
          throw new Error(`Bad Request: Server not initialized. Please ensure your MCP server is running and fully started.`);
        }
        // Throw a generic error if initialization failed
        throw new Error(data.error?.message || 'Failed to initialize session');
      }
    } catch (err) {
      console.error('Session initialization error:', err);
      setError(`Failed to initialize session: ${err.message}`);
      addMessage('System', `Error initializing session: ${err.message}`, 'error'); // Display error in chat
      return null; // Indicate failure
    } finally {
      setIsLoading(false); // Reset loading state
    }
  }, [addMessage]); // Dependency on addMessage to ensure it's the latest version

  // Function to establish Server-Sent Events (SSE) connection for real-time notifications
  const setupSSE = useCallback((currentSessionId) => {
    // Close any existing EventSource connection before creating a new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      console.log('Existing EventSource closed.');
    }

    // If no session ID is available, cannot set up SSE
    if (!currentSessionId) {
      console.warn('Cannot set up SSE: No session ID available.');
      return;
    }

    // Construct the SSE URL with session ID and lastEventId as query parameters.
    // EventSource does not support custom headers directly.
    const sseUrl = `${MCP_SERVER_BASE_URL}?mcp-session-id=${currentSessionId}&last-event-id=${lastEventId}`;

    // Create a new EventSource instance
    const eventSource = new EventSource(sseUrl);

    // Event handler for when the SSE connection is opened
    eventSource.onopen = () => {
      console.log('SSE connection opened.');
      addMessage('System', 'Connected to real-time notifications.');
    };

    // Event handler for incoming SSE messages
    eventSource.onmessage = (event) => {
      // Update lastEventId for resumability in case of disconnection
      if (event.lastEventId) {
        setLastEventId(Number(event.lastEventId));
      }

      try {
        const data = JSON.parse(event.data); // Parse the incoming JSON data
        console.log('Received SSE message:', data);
        // Check for specific notification types and display them
        if (data.method === 'notifications/message' && data.params?.data) {
          addMessage('Notification', data.params.data, data.params.level || 'info');
        } else {
          // Log unknown notification types
          addMessage('System', `Received unknown notification: ${JSON.stringify(data)}`, 'info');
        }
      } catch (e) {
        console.error('Error parsing SSE message:', e, event.data);
        addMessage('System', `Invalid notification data: ${event.data}`, 'error'); // Display parsing errors
      }
    };

    // Event handler for SSE errors (e.g., connection lost)
    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      eventSource.close(); // Close the current connection
      addMessage('System', 'Lost connection to real-time notifications. Attempting to re-establish...', 'error');
      // Attempt to re-initialize session and re-establish SSE after a delay
      setTimeout(() => {
        addMessage('System', 'Reconnecting...', 'info');
        initializeSession().then(newSessionId => {
          if (newSessionId) {
            setupSSE(newSessionId); // If successful, set up SSE again
          }
        });
      }, 3000); // Reconnect after 3 seconds
    };

    // Store the EventSource instance in the ref for later cleanup
    eventSourceRef.current = eventSource;

    // Cleanup function: close EventSource when component unmounts or dependencies change
    return () => {
      eventSource.close();
      console.log('SSE connection closed during cleanup.');
    };
  }, [addMessage, lastEventId, initializeSession]); // Dependencies for setupSSE

  // Initial useEffect hook to set up session and SSE when the component mounts
  useEffect(() => {
    initializeSession().then(newSessionId => {
      if (newSessionId) {
        setupSSE(newSessionId); // Only set up SSE if session initialization was successful
      }
    });

    // Cleanup function: ensure EventSource is closed if the component unmounts
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [initializeSession, setupSSE]); // Dependencies ensure this effect runs when these callbacks change

  // Function to send a message (RPC call) to the MCP server
  const sendMessage = async () => {
    // Prevent sending if input is empty or session is not established
    if (!input.trim() || !sessionId) return;

    addMessage('You', input); // Add user's message to chat
    const query = input;
    setInput(''); // Clear the input field
    setIsLoading(true); // Set loading state
    setError(null); // Clear any previous errors

    let method = 'call_tool'; // Default method for commands
    let params = {};
    let toolName = null;

    // Logic to parse user input and determine which tool to call
    if (query.toLowerCase().startsWith('sum')) {
      const parts = query.split(' ').slice(1);
      const a = parseFloat(parts[0]);
      const b = parseFloat(parts[1]);
      if (!isNaN(a) && !isNaN(b)) {
        toolName = 'calculate_sum';
        params = { a, b };
      } else {
        addMessage('Bot', 'Please provide two numbers for sum (e.g., "sum 5 10").', 'warning');
        setIsLoading(false);
        return;
      }
    } else if (query.toLowerCase().startsWith('greet')) {
      const name = query.substring(6).trim();
      if (name) {
        toolName = 'greet';
        params = { name };
      } else {
        addMessage('Bot', 'Please provide a name to greet (e.g., "greet John").', 'warning');
        setIsLoading(false);
        return;
      }
    } else if (query.toLowerCase().startsWith('multi-greet')) {
      const name = query.substring(12).trim();
      if (name) {
        toolName = 'multi-greet';
        params = { name };
      } else {
        addMessage('Bot', 'Please provide a name for multi-greet (e.g., "multi-greet Alice").', 'warning');
        setIsLoading(false);
        return;
      }
    } else if (query.toLowerCase() === 'session') {
      toolName = 'get_session';
      params = {};
    } else if (query.toLowerCase() === 'list tools') {
      // Provide a list of available commands directly in the client
      addMessage('Bot', 'Available tools: calculate_sum(a, b), greet(name), multi-greet(name), get_session(). Try: "sum 10 20", "greet Alice", "multi-greet Bob", "session".', 'info');
      setIsLoading(false);
      return;
    } else {
      // Default response for unrecognized commands
      addMessage('Bot', 'I can calculate sums (e.g., "sum 5 10"), greet (e.g., "greet John"), send multiple greetings ("multi-greet Alice") or get session info ("session").', 'warning');
      setIsLoading(false);
      return;
    }

    // If no tool was determined, stop and return
    if (!toolName) {
      setIsLoading(false);
      return;
    }

    try {
      // Send the RPC call to the MCP server
      const response = await fetch(MCP_SERVER_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'MCP-Session-Id': sessionId, // Include the session ID in the header
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: method,
          params: {
            toolName: toolName,
            args: params,
          },
          id: Date.now(), // Unique ID for this request
        }),
      });

      const data = await response.json(); // Parse the response from the server
      console.log('Received response from server:', data);

      // Process the response: display result or error
      if (response.ok && data.result) {
        const content = data.result.content || [];
        // Find and display text content from the result
        const textContent = content.find(item => item.type === 'text')?.text;
        if (textContent) {
          addMessage('Bot', textContent);
        } else {
          // If no specific text content, show the raw result
          addMessage('Bot', `Tool executed, but no text content in response. Raw: ${JSON.stringify(data.result)}`, 'info');
        }
      } else {
        // Throw error if the server response indicates an issue
        throw new Error(data.error?.message || 'Unknown error from server');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(`Failed to send message: ${err.message}`);
      addMessage('Bot', `Error: ${err.message}`, 'error'); // Display error in chat
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Handle Enter key press in the input field to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-inter antialiased">
      {/* Tailwind CSS CDN for styling - ensures styles are loaded in an isolated environment */}
      <script src="https://cdn.tailwindcss.com"></script>

      {/* Google Fonts - Inter for clean typography - ensures font is loaded */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Main Chatbot Container */}
      <div className="flex flex-col flex-grow max-w-2xl mx-auto w-full bg-white shadow-lg rounded-lg overflow-hidden my-4">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 flex justify-between items-center rounded-t-lg">
          <h1 className="text-xl font-semibold">MCP Chatbot Client</h1>
          <div className="text-sm">
            {sessionId ? (
              // Display truncated session ID if available
              <span className="text-gray-200">Session ID: <span className="font-mono text-xs">{sessionId.substring(0, 8)}...</span></span>
            ) : (
              // Show connecting message if session is not yet established
              <span className="text-gray-300">Connecting...</span>
            )}
          </div>
        </div>

        {/* Chat Messages Area - scrollable content */}
        <div className="flex-grow p-4 overflow-y-auto space-y-3" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-lg shadow ${msg.sender === 'You'
                    ? 'bg-blue-500 text-white rounded-br-none' // User messages
                    : msg.type === 'error'
                      ? 'bg-red-200 text-red-800 rounded-bl-none' // Error messages
                      : msg.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-800 rounded-bl-none' // Warning messages
                        : msg.type === 'info' || msg.sender === 'System' || msg.sender === 'Notification'
                          ? 'bg-gray-200 text-gray-800 rounded-bl-none' // System/Notification/Info messages
                          : 'bg-gray-300 text-gray-800 rounded-bl-none' // Default bot messages
                  }`}
              >
                <strong className="font-medium">{msg.sender}: </strong>
                <span>{msg.text}</span>
              </div>
            </div>
          ))}
          {/* Ref for auto-scrolling to the end of messages */}
          <div ref={chatEndRef} />
        </div>

        {/* Loading Indicator Section */}
        {isLoading && (
          <div className="p-2 text-center text-blue-600 font-medium bg-blue-50">
            <div className="flex items-center justify-center space-x-2">
              {/* Spinner SVG for loading */}
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Thinking...</span>
            </div>
          </div>
        )}
        {/* Error Display Section */}
        {error && (
          <div className="p-2 text-center bg-red-100 text-red-700 rounded-b-lg">
            Error: {error}
          </div>
        )}

        {/* Chat Input Area */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center space-x-3 rounded-b-lg">
          <input
            type="text"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            // Disable input if session is not ready or loading
            disabled={!sessionId || isLoading}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-semibold shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            // Disable send button if session is not ready, loading, or input is empty
            disabled={!sessionId || isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Export the App component as default
export default App;
