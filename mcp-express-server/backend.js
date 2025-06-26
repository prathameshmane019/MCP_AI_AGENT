// backend/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GeminiMCPClient } from './client/GeminiMCPClient.js';
import { config } from 'dotenv';

// Load environment variables
config();


const app = express();
const PORT = process.env.BACKEND_PORT || 3002;

// Security middleware
app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Global MCP client instance
let mcpClient = null;
let clientInitialized = false;

// Initialize MCP client
async function initializeMCPClient() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    mcpClient = new GeminiMCPClient({
      mcpBaseUrl: process.env.MCP_BASE_URL || "http://localhost:3001/mcp",
      geminiApiKey: process.env.GEMINI_API_KEY,
      geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      debug: process.env.NODE_ENV === 'development'
    });

    await mcpClient.connect();
    
    clientInitialized = true;
    console.log('MCP Client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MCP Client:', error);
    clientInitialized = false;
  }
}

// Middleware to ensure MCP client is initialized
const ensureMCPClient = async (req, res, next) => {
  if (!clientInitialized) {
    return res.status(503).json({
      success: false,
      error: 'MCP Client not initialized. Please check server configuration.'
    });
  }
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mcpClientStatus: clientInitialized ? 'connected' : 'disconnected',
    version: '1.0.0'
  });
});

// Get available tools
app.get('/api/tools', ensureMCPClient, async (req, res) => {
  try {
    const tools = await mcpClient.listAvailableTools();
    res.json({
      success: true,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema?.properties || {}
      }))
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available tools'
    });
  }
});

// Main chat endpoint
app.post('/api/chat', ensureMCPClient, async (req, res) => {
  try {
    const { message, options = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    } 

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 5000 characters allowed.'
      });
    }

    console.log(`Processing chat message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);

    const startTime = Date.now();
    const result = await mcpClient.processUserInput(message, options);
    const processingTime = Date.now() - startTime;

    res.json({
      ...result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process your message. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Execute specific tool directly
app.post('/api/tools/:toolName', ensureMCPClient, async (req, res) => {
  try {
    const { toolName } = req.params;
    const { parameters = {} } = req.body;

    console.log(`Direct tool execution: ${toolName} with parameters:`, parameters);

    const startTime = Date.now();
    const result = await mcpClient.executeTool(toolName, parameters);
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      toolName,
      parameters,
      result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Tool execution error for ${req.params.toolName}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to execute tool: ${req.params.toolName}`,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get chat history (simple in-memory storage for demo)
const chatHistory = [];
const MAX_HISTORY = 100;

app.get('/api/chat/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  const history = chatHistory
    .slice(-limit - offset, chatHistory.length - offset)
    .reverse();
    
  res.json({
    success: true,
    history,
    total: chatHistory.length
  });
});

// Save chat interaction to history
function saveChatToHistory(userMessage, response) {
  chatHistory.push({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    userMessage,
    response,
    toolUsed: response.toolUsed || null
  });
  
  // Keep only the last MAX_HISTORY items
  if (chatHistory.length > MAX_HISTORY) {
    chatHistory.splice(0, chatHistory.length - MAX_HISTORY);
  }
}

// WebSocket support for real-time interactions
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Send current connection count
  socket.emit('connectionCount', io.engine.clientsCount);
  socket.broadcast.emit('connectionCount', io.engine.clientsCount);
  
  // Handle chat messages via WebSocket
  socket.on('chat', async (data) => {
    try {
      console.log(`WebSocket chat from ${socket.id}: ${data.message}`);
      
      if (!clientInitialized) {
        socket.emit('chatResponse', {
          success: false,
          error: 'MCP Client not initialized'
        });
        return;
      }
      
      const startTime = Date.now();
      const result = await mcpClient.processUserInput(data.message, data.options || {});
      const processingTime = Date.now() - startTime;
      
      const response = {
        ...result,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        socketId: socket.id
      };
      
      // Save to history
      saveChatToHistory(data.message, response);
      
      // Send response back to client
      socket.emit('chatResponse', response);
      
    } catch (error) {
      console.error('WebSocket chat error:', error);
      socket.emit('chatResponse', {
        success: false,
        error: 'Failed to process message',
        socketId: socket.id
      });
    }
  });
  
  // Handle tool execution via WebSocket
  socket.on('executeTool', async (data) => {
    try {
      console.log(`WebSocket tool execution from ${socket.id}: ${data.toolName}`);
      
      if (!clientInitialized) {
        socket.emit('toolResponse', {
          success: false,
          error: 'MCP Client not initialized'
        });
        return;
      }
      
      const startTime = Date.now();
      const result = await mcpClient.executeTool(data.toolName, data.parameters || {});
      const processingTime = Date.now() - startTime;
      
      socket.emit('toolResponse', {
        success: true,
        toolName: data.toolName,
        parameters: data.parameters,
        result,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        socketId: socket.id
      });
      
    } catch (error) {
      console.error('WebSocket tool execution error:', error);
      socket.emit('toolResponse', {
        success: false,
        error: `Failed to execute tool: ${data.toolName}`,
        socketId: socket.id
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    socket.broadcast.emit('connectionCount', io.engine.clientsCount);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  if (mcpClient) {
    try {
      await mcpClient.disconnect();
      console.log('MCP Client disconnected');
    } catch (error) {
      console.error('Error disconnecting MCP Client:', error);
    }
  }
  
  server.close(() => {
    console.log('Server shutdown complete');
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    // Initialize MCP client first
    await initializeMCPClient();
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🤖 MCP Client status: ${clientInitialized ? 'Connected' : 'Disconnected'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export for testing
export { app, server, mcpClient };
 
  startServer(); 