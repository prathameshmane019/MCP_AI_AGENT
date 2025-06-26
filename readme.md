AI-Powered Database Explorer
Project Overview
The AI-Powered Database Explorer is a cutting-edge application that redefines database interaction. It empowers users to perform sophisticated queries, complex analytical operations, and comprehensive data management on a PostgreSQL database using natural language. At its core, this system features a Google Gemini-powered AI agent uniquely integrated with the Model Context Protocol (MCP) and Streamable HTTP. This novel combination facilitates highly efficient, real-time communication between the AI and a rich set of custom-built "business tools" exposed via a Node.js Express backend. Hosted on PostgreSQL (Neon) for unparalleled scalability and a dynamic Next.js frontend, this solution is designed to democratize advanced data exploration, enabling non-technical users to derive deep insights and execute complex business logic with unprecedented ease.

This project stands out by pioneering the use of Streamable HTTP as a core transport for AI agent-to-tool communication, offering a stateless, real-time, and highly performant paradigm for intelligent database interaction that moves far beyond traditional API calls.

Features
Groundbreaking Natural Language Interface: Interact with the database using intuitive plain English, powered by Gemini's understanding of complex requests.

Advanced AI Agent Orchestration (MCP & Streamable HTTP):

The Gemini AI agent intelligently interprets user intent, selects, and orchestrates calls to specialized "business tools" rather than generic CRUD operations.

Leverages Model Context Protocol (MCP) for structured communication, ensuring the AI understands the capabilities and parameters of each tool.

Utilizes Streamable HTTP as the primary transport, enabling efficient, stateless, and potentially real-time streaming of tool invocations and results, a novel approach for AI agent-database interaction.

Comprehensive & Complex Business Tools:

Intelligent Data Retrieval: Beyond simple fetches, tools can perform filtered searches (e.g., customers by multiple criteria, products by price range), and retrieve detailed linked data (e.g., all orders for a customer including product specifics).

Analytical Reporting: Generate complex summaries (e.g., product sales by total quantity and revenue) that provide business insights.

Full Data Management (CRUD with Business Logic):

Create: Add new customers, products, and construct complex orders involving multiple products with automatic total amount calculation and stock considerations.

Update: Modify existing records with robust validation.

Delete: Securely remove records with appropriate cascade logic, ensuring data integrity across related tables.

Robust Data Validation: Implements Zod for strict schema validation on all tool parameters, guaranteeing data integrity and preventing malformed inputs.

Real-time Interactions with WebSockets: Integrates Socket.IO for a highly responsive, bidirectional communication channel between the frontend and backend, enhancing the chat experience and enabling instant tool execution feedback.

Secure & Scalable Backend API Gateway: Built on Express.js, fortified with helmet for security headers, cors for controlled access, and express-rate-limit to protect against abuse.

Cloud-Native Database: Leverages PostgreSQL on Neon, offering serverless capabilities, instant branching for development/testing, and auto-scaling for an optimized, cost-effective, and highly available data layer.

Modern & Interactive Frontend: Developed with Next.js and ShadCN UI, providing a fast, reactive, and intuitive user interface with:

Dynamic Data Visualization: Automatically renders query results as interactive tables, insightful bar charts, pie charts, or line charts using Recharts.

Tool Browsing & Direct Execution: A dedicated interface to explore all available AI agent tools with detailed descriptions and parameters, allowing for direct manual execution for debugging or specific needs.

Real-time Status Indicators: Displays connection health, live online user count, and the number of available AI tools.

User Experience Enhancements: Includes user-toggleable dark mode, seamless clipboard integration for message content, and informative toast notifications.

Centralized Configuration: Utilizes dotenv for managing environment variables, facilitating easy deployment across different environments.

Technologies Used
AI & Orchestration:

Google Gemini API: Powers the natural language understanding, intelligent tool selection, and sophisticated response generation.

@modelcontextprotocol/sdk (MCP Client & Server): The foundational protocol and SDK enabling structured, efficient communication between the AI model and the backend tools.

Backend (API Gateway & Tool Orchestration):

Node.js / Express.js: The core runtime and web application framework for the backend server.

Socket.IO: For real-time, bidirectional communication via WebSockets.

streamablehttp & sse (via MCP SDK): Crucial for the efficient, stateless, and potentially real-time HTTP communication with the MCP server, allowing for streaming tool invocations and results.

Zod: A TypeScript-first schema declaration and validation library for robust API input validation.

pg (PostgreSQL client for Node.js): The library used for interacting with the PostgreSQL database.

dotenv: For loading environment variables from a .env file.

helmet: Express middleware for setting various HTTP headers for security.

cors: Node.js middleware for enabling Cross-Origin Resource Sharing.

express-rate-limit: Middleware to limit repeated requests to public APIs.

Database:

PostgreSQL: A powerful, open-source relational database system.

Neon: A serverless PostgreSQL platform offering elasticity, branching, and scalability.

Frontend:

Next.js: A React framework for building performant and scalable web applications.

ShadCN UI: A collection of reusable components built with Radix UI and Tailwind CSS, providing a modern and accessible design system.

Recharts: A composable charting library built with React and D3, used for dynamic data visualizations.

Lucide React: A library of beautiful and customizable SVG icons.

Design Architecture
The system is engineered with a modular, multi-tier architecture, emphasizing clear separation of concerns, scalability, and real-time responsiveness.

graph TD
    A[User (Web Browser)] -->|1. Natural Language Query & Actions (HTTP/WS)| B(Next.js Frontend);

    subgraph Backend API Gateway (Node.js/Express.js)
        B -- RESTful API & WebSocket Communication --> C(backend/server.js);
        C -- Internal Orchestration --> D(client/gemini-mcp-client.js);
        C -- MCP Communication --> E(mcp-express-server/index.js);
        C -- Real-time Updates (Socket.IO) --> B;
    end

    subgraph AI Orchestration Layer
        D -- 2. Tool Selection & Parameter Extraction (Gemini API) --> F[Google Gemini LLM];
        F -- 3. Tool Invocation Request (MCP Streamable HTTP/SSE) --> E;
    end

    subgraph Database Interaction Layer
        E -- 4. Execute Business Tool (Node.js Function) --> G{Custom Business Tools};
        G -- 5. SQL Query Execution --> H[PostgreSQL Database (Neon)];
    end

    H -->|SQL Results| G;
    G -->|Tool Results (Structured Data)| E;
    E -->|MCP Response (Streamable HTTP/SSE)| F;
    F -->|6. Formatted Natural Language Response| D;
    D -->|Processed Response| C;
    C -->|API Response (HTTP/WS)| B;

    style A fill:#e0f7fa,stroke:#00bcd4,stroke-width:2px
    style B fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style C fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style D fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    style E fill:#e0f2f7,stroke:#03a9f4,stroke-width:2px
    style F fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    style G fill:#fbe9e7,stroke:#ff5722,stroke-width:2px
    style H fill:#e1f5fe,stroke:#2196f3,stroke-width:2px

Component Breakdown:
Next.js Frontend (MCPChatAssistant.js):

Role: The interactive user interface. It captures user input, displays chat history, renders dynamic data visualizations (tables, charts), and provides direct tool access.

Technology: React, Next.js, ShadCN UI, Recharts, Lucide React.

Interaction: Communicates with the backend/server.js (API Gateway) via both traditional HTTP requests (for initial data/health checks) and persistent WebSocket (Socket.IO) connections for real-time chat messages and immediate tool execution feedback.

backend/server.js (Express.js API Gateway):

Role: The central entry point for all frontend requests. It acts as a secure and rate-limited proxy, orchestrating communication between the frontend and the AI orchestration layer.

Technology: Node.js, Express.js, Socket.IO, Helmet, CORS, Express-Rate-Limit, Dotenv.

Interaction:

Receives user queries and direct tool execution requests from the frontend.

Manages WebSocket connections, broadcasting connection counts and handling real-time chat/tool events.

Initializes and holds the GeminiMCPClient instance.

Forwards user inputs to the GeminiMCPClient for AI processing.

Receives processed responses and tool results from the GeminiMCPClient and sends them back to the frontend.

Provides health checks and a list of available tools to the frontend.

client/gemini-mcp-client.js (Client-side AI Orchestrator within Backend):

Role: The intelligence core of the application responsible for integrating Google Gemini with the MCP server to enable natural language database interaction.

Technology: @modelcontextprotocol/sdk/client, GoogleGenerativeAI.

Interaction:

Connects to the mcp-express-server using StreamableHTTPClientTransport (with SSE fallback), establishing the MCP communication channel.

Tool Selection (Step 2): Sends the user's natural language query, along with the descriptions and schemas of all available database tools, to the Google Gemini LLM. Gemini's role here is critical: it analyzes the query, determines the most appropriate "business tool" to use, and extracts the necessary parameters.

Tool Execution (Step 3): Invokes the selected tool on the mcp-express-server via the MCP callTool method, passing the extracted parameters.

Response Formatting (Step 6): Takes the raw, structured results received from the executed tool and sends them back to the Google Gemini LLM for natural language generation, transforming technical data into a user-friendly conversational response. If no tool is needed, Gemini directly generates a response.

mcp-express-server/index.js (MCP Server & Database Tools Host):

Role: Hosts the MCP server, which defines and exposes the specific "business tools" that interact directly with the database. This server acts as the bridge between the AI agent's tool calls and the actual database operations.

Technology: Node.js, Express.js, @modelcontextprotocol/sdk/server, Zod, pg.

Interaction:

Receives tool invocation requests from the GeminiMCPClient via Streamable HTTP (or SSE).

Executes Business Tool (Step 4): Based on the tool name and parameters received, it calls the corresponding Node.js function (e.g., get_customers, create_order, get_product_sales_summary).

SQL Query Execution (Step 5): These Node.js functions construct and execute parameterized SQL queries against the PostgreSQL database via lib/db.js.

Returns the structured results of the database operation back to the GeminiMCPClient via MCP.

Manages MCP sessions and transport.

Google Gemini LLM:

Role: The external large language model service that provides the core AI capabilities for natural language understanding, tool selection, and human-like response generation.

Interaction: Communicates with the GeminiMCPClient via its API.

PostgreSQL Database (on Neon):

Role: The persistent data store for all customer, product, and order information.

Technology: PostgreSQL, hosted on Neon.

Interaction: Receives and processes SQL queries from the "Custom Business Tools" functions, returning the requested data.

Flow of Operations:
User Initiates: A user types a natural language query (e.g., "Show me the total revenue from laptops last month") into the Next.js Frontend.

Frontend to API Gateway: The frontend sends this query to the /api/chat endpoint on the backend/server.js (API Gateway), typically over a WebSocket connection for real-time responsiveness.

API Gateway to AI Orchestrator: The backend/server.js passes the user's message to its internally managed client/gemini-mcp-client.js instance.

AI Tool Selection (Gemini): The GeminiMCPClient sends the user's query, along with the descriptions and schemas of all available "business tools," to the Google Gemini LLM. Gemini interprets the intent and identifies the most relevant tool (e.g., get_product_sales_summary) and extracts parameters (e.g., product_name: "laptop", start_date: "last_month").

Tool Invocation (MCP Streamable HTTP): The GeminiMCPClient then makes an MCP callTool request to the dedicated mcp-express-server/index.js, specifying the chosen tool and its parameters. This leverages Streamable HTTP for efficient communication.

Tool Execution (Database Interaction): The mcp-express-server receives the MCP request, validates parameters using Zod, and executes the corresponding Node.js function within its "Custom Business Tools" layer. This function constructs and runs the necessary SQL query against the PostgreSQL Database (on Neon).

Tool Results Return: The database returns the query results, which are then packaged by the executed tool and sent back to the GeminiMCPClient via the MCP response mechanism.

AI Response Formatting (Gemini): The GeminiMCPClient takes the structured tool results and the original user query, and sends them back to the Google Gemini LLM. Gemini's task here is to transform the raw data into a natural, conversational, and easy-to-understand response for the end-user.

Final Response to Frontend: The formatted natural language response is sent from the GeminiMCPClient back to the backend/server.js.

Frontend Display & Visualization: The backend/server.js relays this final response to the Next.js Frontend (via WebSocket), which displays the conversational text and, crucially, automatically renders interactive charts (Bar, Pie, Line) or tables based on the structured data returned by the tool, providing a rich, visual insight.

Chat History & Status: The backend/server.js updates its in-memory chat history, and the frontend constantly displays connection status, online users, and available tools.

Installation and Setup
(This section would require more specific setup instructions for your entire project. Below is a placeholder.)

Clone the repository:
git clone [your-repo-url]
cd [your-repo-name]

Environment Variables (.env):
Create a .env file in your backend directory (and potentially client if GEMINI_API_KEY is used there directly, though it's passed from backend/server.js in your current setup).

# Backend Server Configuration
BACKEND_PORT=3002
FRONTEND_URL=http://localhost:3000 # Or your deployed frontend URL

# MCP Server Configuration
MCP_BASE_URL=http://localhost:3001/mcp # URL where mcp-express-server is running

# Gemini API Configuration
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-1.5-flash # Or gemini-1.5-pro, etc.

# PostgreSQL Database Configuration (for lib/db.js)
DATABASE_URL="postgresql://user:password@host:port/database" # Your Neon connection string

Replace YOUR_GEMINI_API_KEY and DATABASE_URL with your actual credentials.

Database Setup (PostgreSQL on Neon):

Create a PostgreSQL database instance on Neon.

Obtain your connection string.

Run your database schema migrations (e.g., using psql, sequelize-cli, knex, or a custom script) to create the customers, products, orders, and order_items tables with appropriate primary/foreign keys and cascade delete rules. Ensure CASCADE DELETE is set on foreign keys where appropriate (e.g., orders and order_items when a customer is deleted, order_items when a product is deleted).

MCP Express Server Setup:

Navigate to the directory containing mcp-express-server/index.js (or the equivalent).

Install dependencies: npm install (or yarn install).

Start the MCP server: node mcp-express-server/index.js (or npm run start:mcp-server).

Backend API Gateway Setup:

Navigate to the directory containing backend/server.js.

Install dependencies: npm install (or yarn install).

Start the backend API gateway: node backend/server.js (or npm run start:backend).

Frontend Setup:

Navigate to your Next.js frontend directory.

Install dependencies: npm install (or yarn install).

Ensure your frontend code is configured to communicate with your backend/server.js (e.g., http://localhost:3002 or your deployed backend URL).

Start the frontend development server: npm run dev.

Usage
Once all components are running:

Open your Next.js frontend application in a web browser.

Type a natural language query into the chat interface.

Examples of Complex Business Queries:

"Show me the top 5 customers by their total order value."

"What products have less than 10 units in stock, and what's their average price?"

"Create a new customer named 'Sarah Connor' with email sarah.c@example.com, and then create an order for her including 3 units of 'Product X' and 1 unit of 'Product Y'."

"Update the status of order ID 123 to 'completed' and recalculate its total amount."

"Provide a sales summary for all products, showing total quantity sold and total revenue, visualized as a bar chart."

"Delete customer ID 101 and all their associated orders."

The AI agent will process your request, intelligently interact with the database using its specialized tools, and provide a conversational response, often accompanied by interactive data visualizations.

Observe real-time updates and responses via the WebSocket connection.

Explore the "Tools" tab to see all available database operations and even execute them directly for testing or specific needs.

Toggle between light and dark mode for your preferred viewing experience.

Contributing
(Add guidelines for contributions here, e.g., how to set up a development environment, run tests, submit pull requests.)

License
(Specify your project's license, e.g., MIT, Apache 2.0.)

Contact
(Your contact information or preferred method of communication.)
