'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Send,
  RefreshCw,
  Moon,
  Sun,
  Activity,
  Code,
  MessageSquare,
  Zap,
  Users, 
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Database, 
  Table,
  BarChart3, 
  Bot,
  User,
  Copy,
  Check,
  Terminal, 
  TrendingUp, 
} from 'lucide-react';

// Charts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// ShadCN Components
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function MCPChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [availableTools, setAvailableTools] = useState([]);
  const [connectionCount, setConnectionCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [socket, setSocket] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Chart colors
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  // Initialize connection
  useEffect(() => {
    initializeConnection();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeConnection = async () => {
    try {
      // Check server health
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/health`);
      const health = await response.json();
      
      if (health.success) {
        setIsConnected(true);
        fetchAvailableTools();
        showToastMessage('Connected to MCP server', 'success');
        
        // Initialize WebSocket connection
        const io = await import('socket.io-client');
        const socketConnection = io.default('process.env.NEXT_PUBLIC_BACKEND_URL');
        
        socketConnection.on('connect', () => {
          setSocket(socketConnection);
          console.log('WebSocket connected');
        });
        
        socketConnection.on('connectionCount', (count) => {
          setConnectionCount(count);
        });
        
        socketConnection.on('chatResponse', (response) => {
          setIsLoading(false);
          addMessage({
            type: 'assistant',
            ...response
          });
        });
        
        socketConnection.on('toolResponse', (response) => {
          setIsLoading(false);
          addMessage({
            type: 'tool',
            ...response
          });
        });
      }
    } catch (error) {
      console.error('Connection failed:', error);
      showToastMessage('Failed to connect to server', 'error');
    }
  };

  const fetchAvailableTools = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tools`);
      const data = await response.json();
      if (data.success) {
        setAvailableTools(data.tools);
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    }
  };

  const showToastMessage = (message, type = 'info', duration = 3000) => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), duration);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const addMessage = (message) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    }]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isConnected) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    addMessage({
      type: 'user',
      content: userMessage
    });

    try {
      if (socket) {
        // Use WebSocket for real-time communication
        socket.emit('chat', { message: userMessage });
      } else {
        // Fallback to HTTP API
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();
        setIsLoading(false);
        
        addMessage({
          type: 'assistant',
          ...data
        });
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Send message error:', error);
      showToastMessage('Failed to send message', 'error');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const executeDirectTool = async (toolName, parameters = {}) => {
    if (!isConnected) return;

    setIsLoading(true);
    addMessage({
      type: 'system',
      content: `Executing tool: ${toolName}`,
      toolUsed: toolName
    });

    try {
      if (socket) {
        socket.emit('executeTool', { toolName, parameters });
      } else {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tools/${toolName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ parameters })
        });

        const data = await response.json();
        setIsLoading(false);
        
        addMessage({
          type: 'tool',
          ...data
        });
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Tool execution error:', error);
      showToastMessage('Failed to execute tool', 'error');
    }

    setShowToolsMenu(false);
  };

  const parseTableData = (text) => {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (error) { 
    }
    return null;
  };

  const generateChartData = (data, type = 'bar') => {
    if (!data || !Array.isArray(data)) return null;

    // For products data
    if (data[0]?.product_name) {
      return data.map(item => ({
        name: item.product_name,
        value: parseFloat(item.price) || 0,
        stock: item.stock_quantity || 0,
        price: parseFloat(item.price) || 0
      }));
    }

    // For customers data (count by state/city)
    if (data[0]?.state) {
      const stateCount = data.reduce((acc, item) => {
        acc[item.state] = (acc[item.state] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(stateCount).map(([state, count]) => ({
        name: state,
        value: count
      }));
    }

    // For orders data
    if (data[0]?.order_date) {
      return data.map((item, index) => ({
        name: `Order ${item.order_id || index + 1}`,
        value: parseFloat(item.total_amount) || 0,
        date: item.order_date
      }));
    }

    return null;
  };

  const DataVisualization = ({ data, title }) => {
    const tableData = parseTableData(data);
    const chartData = generateChartData(tableData);
    const [viewMode, setViewMode] = useState('table'); // 'table', 'bar', 'pie', 'line'

    if (!tableData) return null;

    const renderTable = () => (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              {Object.keys(tableData[0]).map((key) => (
                <th key={key} className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-medium">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {Object.values(row).map((value, cellIndex) => (
                  <td key={cellIndex} className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    const renderBarChart = () => (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#3b82f6" />
          {chartData[0]?.stock && <Bar dataKey="stock" fill="#10b981" />}
        </BarChart>
      </ResponsiveContainer>
    );

    const renderPieChart = () => (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );

    const renderLineChart = () => (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );

    return (
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database size={20} />
              {title || 'Data Visualization'}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Table size={16} />
              </Button>
              {chartData && (
                <>
                  <Button
                    variant={viewMode === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('bar')}
                  >
                    <BarChart3 size={16} />
                  </Button>
                  <Button
                    variant={viewMode === 'pie' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('pie')}
                  >
                    <TrendingUp size={16} />
                  </Button>
                  <Button
                    variant={viewMode === 'line' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('line')}
                  >
                    <Activity size={16} />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' && renderTable()}
          {viewMode === 'bar' && chartData && renderBarChart()}
          {viewMode === 'pie' && chartData && renderPieChart()}
          {viewMode === 'line' && chartData && renderLineChart()}
        </CardContent>
      </Card>
    );
  };

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      showToastMessage('Copied to clipboard', 'success', 1500);
    } catch (error) {
      showToastMessage('Failed to copy', 'error');
    }
  };

  const clearMessages = () => {
    setMessages([]);
    showToastMessage('Messages cleared', 'info', 2000);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const MessageComponent = ({ message }) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';
    const isTool = message.type === 'tool';
    const isError = !message.success && message.error;

    const getMessageContent = () => {
      if (message.finalResponse) {
        return message.finalResponse;
      }
      if (message.content) {
        return message.content;
      }
      if (message.toolResult?.content) {
        return message.toolResult.content
          .map(item => item.text || item.content || '')
          .join(' ');
      }
      return message.result || 'No content';
    };

    const getToolDetails = () => {
      if (!message.toolUsed) return null;
      
      return (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap size={12} />
              {message.toolUsed}
            </Badge>
            {message.processingTime && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock size={12} />
                {message.processingTime}
              </Badge>
            )}
          </div>
          
          {message.toolParameters && Object.keys(message.toolParameters).length > 0 && (
            <div className="text-xs opacity-70">
              <strong>Parameters:</strong> {JSON.stringify(message.toolParameters, null, 2)}
            </div>
          )}
          
          {message.reasoning && (
            <div className="text-xs opacity-70 mt-2">
              <strong>Reasoning:</strong> {message.reasoning}
            </div>
          )}
        </div>
      );
    };

    const getDataVisualization = () => {
      if (!message.toolResult?.content) return null;
      
      const content = message.toolResult.content[0];
      if (content?.text) {
        const tableData = parseTableData(content.text);
        if (tableData) {
          return (
            <DataVisualization 
              data={content.text} 
              title={`${message.toolUsed} Results`}
            />
          );
        }
      }
      return null;
    };

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <Card className={`
          max-w-[90%] shadow-lg border-0
          ${isUser 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
            : isSystem 
            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
            : isTool
            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
            : isError
            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
            : darkMode 
            ? 'bg-gray-800 border-gray-700 text-gray-100' 
            : 'bg-white border-gray-200 text-gray-900'
          }
        `}>
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                {isUser ? (
                  <User size={20} className="mt-0.5" />
                ) : isTool ? (
                  <Terminal size={20} className="mt-0.5" />
                ) : (
                  <Bot size={20} className="mt-0.5" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {getMessageContent()}
                </div>
                
                {getToolDetails()}
                
                {message.error && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error: {message.error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(getMessageContent(), message.id)}
                    className="h-6 w-6 p-0"
                  >
                    {copiedMessageId === message.id ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {getDataVisualization()}
          </CardContent>
        </Card>
      </div>
    );
  };

  const ToastComponent = () => {
    if (!showToast) return null;

    const getToastIcon = () => {
      switch (showToast.type) {
        case 'success': return <CheckCircle className="text-green-500" size={20} />;
        case 'error': return <XCircle className="text-red-500" size={20} />;
        case 'warning': return <AlertCircle className="text-yellow-500" size={20} />;
        default: return <AlertCircle className="text-blue-500" size={20} />;
      }
    };

    return (
      <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
        <Alert className="max-w-md">
          {getToastIcon()}
          <AlertDescription className="flex items-center justify-between">
            <span>{showToast.message}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowToast(null)}
              className="h-6 w-6 p-0 ml-2"
            >
              <X size={16} />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const ToolsPanel = () => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code size={20} />
          Available Tools
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {availableTools.map((tool, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{tool.name}</h4>
                  <Button
                    size="sm"
                    onClick={() => executeDirectTool(tool.name, {})}
                    disabled={!isConnected}
                  >
                    Execute
                  </Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {tool.description}
                </p>
                {Object.keys(tool.parameters || {}).length > 0 && (
                  <div className="text-xs text-gray-500">
                    <strong>Parameters:</strong> {Object.keys(tool.parameters).join(', ')}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
 
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="container mx-auto h-screen p-4 flex flex-col">
        {/* Header */}
        <Card className="mb-4 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                    <MessageSquare className="text-white" size={24} />
                  </div>
                  <CardTitle className="text-2xl">MCP Chat Assistant</CardTitle>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className={isConnected ? 'text-green-500' : 'text-red-500'} size={16} />
                    <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  {connectionCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="text-gray-500" size={16} />
                      <span className="text-gray-600 dark:text-gray-300">
                        {connectionCount} user{connectionCount !== 1 ? 's' : ''} online
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Code className="text-gray-500" size={16} />
                    <span className="text-gray-600 dark:text-gray-300">
                      {availableTools.length} tool{availableTools.length !== 1 ? 's' : ''} available
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                >
                  <RefreshCw size={20} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare size={16} />
                Chat
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2">
                <Code size={16} />
                Tools
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 mt-4 overflow-hidden">
              <TabsContent value="chat" className="h-full">
                <Card className="h-full flex flex-col">
                  <CardContent className="flex-1 p-6 overflow-hidden">
                    <ScrollArea className="h-full" ref={chatContainerRef}>
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                          <div className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                            <MessageSquare className="text-white" size={48} />
                          </div>
                          <div className="space-y-4">
                            <h2 className="text-xl font-semibold">
                              Welcome to MCP Chat Assistant
                            </h2>
                            <p className="max-w-md text-gray-600 dark:text-gray-300">
                              Start a conversation! I can help you with data queries, calculations, 
                              text analysis, and more. Try asking me something like:
                            </p>
                            <div className="space-y-2 text-sm text-blue-500">
                              <p>&quot;Show all products data&quot;</p>
                              <p>&quot;Get all customers&quot;</p>
                              <p>&quot;Display orders with charts&quot;</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {messages.map((message) => (
                            <MessageComponent key={message.id} message={message} />
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent> 
              <TabsContent value="tools" className="h-full">
                <ToolsPanel />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Input Area */}
        <Card className="mt-4 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isConnected ? "Type your message..." : "Connecting..."}
                  disabled={!isConnected || isLoading}
                  className="text-lg py-6"
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!isConnected || isLoading || !inputMessage.trim()}
                className="px-6 py-6"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send size={20} className="mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ToastComponent />
    </div>
  );
}