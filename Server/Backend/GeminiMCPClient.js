// client/gemini-mcp-client.js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
  
export class GeminiMCPClient {
  constructor(config = {}) {
    this.mcpClient = null;
    this.geminiClient = null;
    this.sessionId = null;
    this.isConnected = false;
    this.availableTools = [];


    // Configuration
    this.config = {
      mcpBaseUrl: config.mcpBaseUrl || "http://localhost:3001/mcp",
      geminiApiKey: config.geminiApiKey || process.env.GEMINI_API_KEY,
      geminiModel: config.geminiModel || "gemini-2.5-flash",
      debug: config.debug || false,
      ...config
    };

    if (!this.config.geminiApiKey) {
      throw new Error("Gemini API key is required. Set GEMINI_API_KEY environment variable or pass geminiApiKey in config.");
    }

    this.initializeGemini();
  }

  initializeGemini() {
    try {
      const genAI = new GoogleGenerativeAI(this.config.geminiApiKey);
      this.geminiClient = genAI.getGenerativeModel({ model: this.config.geminiModel });
      this.log("Gemini client initialized successfully to model ", this.config.geminiModel);
    } catch (error) {
      console.error("Failed to initialize Gemini client:", error);
      throw error;
    }
  }

  async connect() {
    try {
      this.mcpClient = new Client({
        name: 'gemini-enhanced-mcp-client',
        version: '1.0.0'
      });

      const baseUrl = new URL(this.config.mcpBaseUrl);

      try {
        // Try StreamableHTTP first
        const transport = new StreamableHTTPClientTransport(baseUrl);
        await this.mcpClient.connect(transport);
        this.log("Connected using Streamable HTTP transport");
      } catch (error) {
        // Fallback to SSE
        this.log("Streamable HTTP connection failed, falling back to SSE transport");
        this.mcpClient = new Client({
          name: 'gemini-sse-client',
          version: '1.0.0'
        });
        const sseTransport = new SSEClientTransport(baseUrl);
        await this.mcpClient.connect(sseTransport);
        this.log("Connected using SSE transport");
      }

      this.isConnected = true;
      await this.loadAvailableTools();
      this.log("MCP Client connected and tools loaded");

    } catch (error) {
      console.error("Failed to connect MCP client:", error);
      throw error;
    }
  }

  async loadAvailableTools() {
    try {
      const response = await this.mcpClient.listTools();
      this.availableTools = response.tools || [];
      this.log(`Loaded ${this.availableTools.length} tools:`, this.availableTools.map(t => t.name));
    } catch (error) {
      console.error("Failed to load tools:", error);
      this.availableTools = [];
    }
  }

  async processUserInput(userInput, options = {}) {
    if (!this.isConnected) {
      throw new Error("Client not connected. Call connect() first.");
    }

    try {
      this.log(`Processing user input: "${userInput}"`);

      // Step 1: Use Gemini to understand user intent and determine which tool to use
      const toolSelection = await this.selectToolWithGemini(userInput);

      if (!toolSelection.toolName) {
        // No tool needed, just respond with Gemini
        return await this.getGeminiResponse(userInput);
      }

      // Step 2: Execute the selected tool
      const toolResult = await this.executeTool(toolSelection.toolName, toolSelection.parameters);

      // Step 3: Use Gemini to format the final response
      const finalResponse = await this.formatResponseWithGemini(userInput, toolResult, toolSelection);

      return {
        success: true,
        userInput,
        toolUsed: toolSelection.toolName,
        toolParameters: toolSelection.parameters,
        toolResult,
        finalResponse,
        reasoning: toolSelection.reasoning
      };

    } catch (error) {
      console.error("Error processing user input:", error);
      return {
        success: false,
        error: error.message,
        userInput
      };
    }
  }

  async selectToolWithGemini(userInput) {
    const toolsInfo = this.availableTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema?.properties || {}
    }));

    // Explicitly tell Gemini to return an empty object for parameters if not needed
    // and provide examples that reflect this.
    const prompt = `
You are an intelligent assistant that determines which tool to use based on user input. 

Available tools:
${JSON.stringify(toolsInfo, null, 2)}

User input: "${userInput}"

Analyze the user input and determine:
1. Which tool (if any) should be used
2. What parameters should be passed to the tool. If no parameters are needed, provide an empty object: {}.
3. Your reasoning for the selection

Respond with a JSON object in this exact format:
{
  "toolName": "tool_name_or_null",
  "parameters": {},
  "reasoning": "explanation of your choice"
}

Rules:
- If no tool is needed for the user's request, set "toolName" to null and "parameters" to {}.
- Only use tools that are available in the list above.
- Ensure parameters match the tool's expected input schema.
- Be precise with parameter types (numbers, strings, booleans).

Examples:
- User: "Retrieve all customers"
  Response: { "toolName": "get_customers", "parameters": {}, "reasoning": "User requested all customer information, so the 'get_customers' tool is used with no specific filters." }

- User: "Find products with price between 10 and 50"
  Response: { "toolName": "get_products", "parameters": { "min_price": 10, "max_price": 50 }, "reasoning": "User is looking for products within a price range, so 'get_products' is selected with min_price and max_price." }

- User: "Hello there"
  Response: { "toolName": null, "parameters": {}, "reasoning": "The user input is a casual greeting and does not require a tool." }
`;

    try {
      const result = await this.geminiClient.generateContent(prompt);
      const response = result.response.text();
      this.log("Gemini tool selection response:", response);

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Gemini response");
      }

      const toolSelection = JSON.parse(jsonMatch[0]);

      // Ensure parameters is an object, even if Gemini returns null or omits it
      toolSelection.parameters = toolSelection.parameters || {};

      this.log("Tool selection result:", toolSelection);

      return toolSelection;
    } catch (error) {
      console.error("Error in tool selection:", error);
      return {
        toolName: null,
        parameters: {}, // Ensure parameters is an object even on error
        reasoning: "Error in tool selection process"
      };
    }
  }

  async executeTool(toolName, parameters) {
    try {
      this.log(`Executing tool: ${toolName} with parameters:`, parameters);

      const result = await this.mcpClient.callTool({
        name: toolName,
        arguments: parameters // This should now always be an object
      });

      this.log("Tool execution result:", result);
      return result;
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      throw error;
    }
  }

  async formatResponseWithGemini(userInput, toolResult, toolSelection) {
    const prompt = `
You are a helpful assistant. A user asked: "${userInput}"

You used the tool "${toolSelection.toolName}" with reasoning: "${toolSelection.reasoning}"

The tool returned this result:
${JSON.stringify(toolResult, null, 2)}

Format a natural, conversational response for the user that:
1. Answers their original question
2. Incorporates the tool's result naturally
3. Is helpful and easy to understand
4. Doesn't expose technical details unless relevant

Keep the response concise but complete.
`;

    try {
      const result = await this.geminiClient.generateContent(prompt);
      const response = result.response.text();
      this.log("Gemini formatted response:", response);
      return response;
    } catch (error) {
      console.error("Error formatting response:", error);
      // Fallback to raw tool result
      return this.formatToolResultFallback(toolResult);
    }
  }

  async getGeminiResponse(userInput) {
    try {
      const result = await this.geminiClient.generateContent(userInput);
      const response = result.response.text();

      return {
        success: true,
        userInput,
        toolUsed: null,
        toolParameters: null,
        toolResult: null,
        finalResponse: response,
        reasoning: "Direct Gemini response - no tool needed"
      };
    } catch (error) {
      console.error("Error getting Gemini response:", error);
      throw error;
    }
  }

  formatToolResultFallback(toolResult) {
    if (toolResult.content && toolResult.content[0] && toolResult.content[0].text) {
      return toolResult.content[0].text;
    }
    return JSON.stringify(toolResult, null, 2);
  }

  async listAvailableTools() {
    return this.availableTools;
  }

  async disconnect() {
    if (this.mcpClient && this.isConnected) {
      try {
        await this.mcpClient.close();
        this.isConnected = false;
        this.log("MCP Client disconnected");
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
    }
  }

  log(message, data = null) {
    if (this.config.debug) {
      console.log(`[GeminiMCPClient] ${message}`, data || '');
    }
  }
}

// Usage example
export async function createGeminiMCPClient(config = {}) {
  const client = new GeminiMCPClient(config);
  await client.connect();
  return client;
}

// Simple test function
export async function testGeminiMCPClient() {
  try {
    const client = await createGeminiMCPClient({
      debug: true,
      geminiApiKey: process.env.GEMINI_API_KEY
    });

    console.log("Testing various inputs...");

    const testInputs = [
      "Show all products",
      "Find all customers",
      "Show all orders with customers",
      "Get product with ID 1", // Test specific ID retrieval
      "List customers named 'John'", // Test filtering
      "What is the inventory status?", // Test new tool
      "Show monthly sales for 2024", // Test new tool
      "Who are the top 3 spending customers?" // Test new tool
    ];

    for (const input of testInputs) {
      console.log(`\n--- Testing: "${input}" ---`);
      const result = await client.processUserInput(input);
      console.log("Result:", result.finalResponse);
    }

    await client.disconnect();
  } catch (error) {
    console.error("Test failed:", error);
  }
}

export default GeminiMCPClient;