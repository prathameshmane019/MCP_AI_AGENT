AI-Powered Database Explorer
Project Overview
The AI-Powered Database Explorer is a sophisticated application that transforms how users interact with relational databases. It enables natural language queries and full CRUD (Create, Read, Update, Delete) operations on a PostgreSQL database, all powered by an intelligent AI agent. This system leverages the Model Context Protocol (MCP) for seamless communication between a Gemini-powered AI client and a Node.js Express backend, which exposes a rich set of database interaction tools. Hosted on PostgreSQL (Neon) for scalability and a responsive Next.js frontend, this solution democratizes data access, making complex database operations accessible to non-technical users and accelerating data-driven insights.

Features
Natural Language Interface: Users can interact with the database using plain English queries, eliminating the need for SQL knowledge.

Intelligent Tool Orchestration: A Gemini-powered AI agent intelligently selects and executes the most appropriate database tool based on user intent.

Comprehensive Database Operations:

Retrieval (Read): Fetch customer, product, and order information with various filters. Includes advanced queries like retrieving all orders for a specific customer (with product details) and generating product sales summaries.

Creation (Create): Add new customers, products, and create complex orders that can include multiple products.

Updates (Update): Modify existing customer, product, and order records.

Deletion (Delete): Remove customers, products, and orders, with automatic cascade deletion of related data (e.g., deleting a customer also deletes their orders).

Robust Data Validation: Utilizes Zod for strict schema validation of all tool parameters, ensuring data integrity and preventing malformed requests.

Efficient Communication (Streamable HTTP/SSE): Employs streamablehttp for efficient client-server communication, with a fallback to Server-Sent Events (SSE), enabling potentially real-time feedback and long-running operations.

Real-time Interactions with WebSockets: Integrates Socket.IO for real-time chat and direct tool execution, providing a highly responsive user experience.

Secure & Scalable Backend API Gateway: Built on Express.js, protected with helmet for security headers, cors for controlled access, and express-rate-limit to prevent abuse.

Cloud-Native Database: Leverages PostgreSQL on Neon, offering serverless capabilities, instant branching, and auto-scaling for an optimized and cost-effective data layer.

Modern & Interactive Frontend: Developed with Next.js and ShadCN UI, providing a fast, reactive, and intuitive user interface with:

Dynamic Data Visualization: Automatically renders query results as interactive tables, bar charts, pie charts, or line charts.

Tool Browsing: A dedicated tab to view all available AI agent tools with their descriptions and parameters, allowing for direct execution.

Real-time Connection Status: Displays connection health, online user count, and available tool count.

Dark Mode: User-toggleable dark mode for enhanced readability.

Clipboard Integration: Easily copy message content.

Toast Notifications: Provides clear, ephemeral feedback for user actions and system status.

Centralized Configuration: Utilizes dotenv for managing environment variables, facilitating easy deployment across different environments.

API Endpoints: Provides dedicated endpoints for health checks, listing available tools, processing chat messages, and directly executing tools.

In-Memory Chat History: Maintains a simple in-memory chat history for recent interactions.

Technologies Used
AI & Orchestration:

Google Gemini API: Powers the natural language understanding, tool selection, and response generation.

@modelcontextprotocol/sdk (MCP Client & Server): Facilitates structured communication between the AI model and the backend tools.

Backend (API Gateway & Tool Orchestration):

Node.js / Express.js: Core framework for the backend server.

Socket.IO: For real-time, bidirectional communication (WebSockets).

streamablehttp & sse (via MCP SDK): For efficient, real-time HTTP communication with the MCP server.

Zod: Schema validation library for API inputs.

pg (PostgreSQL client for Node.js): For interacting with the PostgreSQL database.

dotenv: For loading environment variables.

helmet: For setting secure HTTP headers.

cors: For enabling Cross-Origin Resource Sharing.

express-rate-limit: For protecting against brute-force attacks.

Database:

PostgreSQL: Relational database.

Neon: Serverless PostgreSQL service.

Frontend:

Next.js: React framework for building the user interface.

ShadCN UI: Reusable UI components for a modern design.

Recharts: For declarative charting (Bar, Pie, Line charts).

Lucide React: For a comprehensive set of customizable SVG icons.

Design Architecture
The system is designed with a clear separation of concerns across three main layers: Frontend, Backend (API Gateway, AI Agent & Tools), and Database.

graph TD
    A[User (Browser)] -->|Natural Language Query (HTTP/WS)| B(Next.js Frontend);

    subgraph Backend API Gateway (Node.js/Express.js)
        B -- HTTP/WS API Requests --> C(backend/server.js);
        C -- Internal API Calls --> D(client/gemini-mcp-client.js);
        C -- Internal API Calls --> E(mcp-express-server/index.js);
        C -- Real-time Updates (Socket.IO) --> B;
    end

    subgraph AI Orchestration & MCP Communication
        D -- 1. Select Tool & Params (Gemini API) --> F[Google Gemini LLM];
        F -- Tool Call Request (MCP Streamable HTTP/SSE) --> E;
    end

    subgraph Database Interaction Layer
        E -- 2. Execute Tool (e.g., get_customers) --> G{Database Tools (Node.js)};
        G -- SQL Query --> H[PostgreSQL Database (Neon)];
    end

    H -->|SQL Results| G;
    G -->|Tool Results (MCP Response)| E;
    E -->|Formatted Response (Gemini API)| F;
    F -->|Final Response| D;
    D -->|Processed Response| C;
    C -->|API Response (HTTP/WS)| B;

    style C fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#ccf,stroke:#333,stroke-width:2px
    style E fill:#fcf,stroke:#333,stroke-width:2px
    style F fill:#cfc,stroke:#333,stroke-width:2px
    style G fill:#ffc,stroke:#333,stroke-width:2px
    style H fill:#cff,stroke:#333,stroke-width:2px

Component Breakdown:
Next.js Frontend:

The primary user interface where users input natural language queries and view results.

Built with React and styled using ShadCN UI components for a modern, responsive design.

Communicates with the backend/server.js (API Gateway) via both standard HTTP requests and WebSockets (Socket.IO) for real-time interactions.

Sends user inputs and receives processed responses from the AI agent.

Renders dynamic content, including chat history, database query results, and interactive data visualizations (tables, bar charts, pie charts, line charts using Recharts).

Manages UI state, dark mode, toast notifications, and provides a dedicated panel for browsing and directly executing available tools.

backend/server.js (Express.js API Gateway):

Acts as the central API endpoint for the frontend.

Handles incoming HTTP requests (e.g., /api/chat, /api/tools, /api/health).

Manages WebSocket connections via Socket.IO, enabling real-time chat and tool execution.

Implements security best practices (Helmet, CORS, Rate Limiting).

Initializes and manages the lifecycle of the GeminiMCPClient.

Orchestrates the flow of data between the frontend and the GeminiMCPClient.

Maintains a simple in-memory chat history.

client/gemini-mcp-client.js (Client-side AI Orchestrator within Backend):

This module is instantiated and managed by backend/server.js.

Initialization & Connection: Establishes and manages the connection to the mcp-express-server using StreamableHTTPClientTransport (with a fallback to SSEClientTransport).

Gemini Integration: Initializes the GoogleGenerativeAI client using the provided API key and model.

Tool Selection: Uses the Gemini LLM to analyze user input and determine which database tool (exposed by the MCP server) is most appropriate to call, along with the necessary parameters. This involves crafting a specific prompt to guide Gemini's decision-making.

Tool Execution: Calls the selected tool on the mcp-express-server via the MCP client.

Response Formatting: Uses Gemini again to take the raw tool results and format them into a natural, conversational response suitable for the end-user.

Direct Gemini Response: If no tool is deemed necessary, it can directly generate a response using Gemini.

mcp-express-server/index.js (MCP Server & Database Tools):

This is a separate Express.js server that specifically hosts the Model Context Protocol (MCP) server.

It defines and exposes the various database interaction tools (e.g., get_customers, create_product, update_order, get_product_sales_summary).

Each tool has a name, description (for the AI agent), and a Zod schema for input validation.

The tool's implementation directly executes SQL queries against the PostgreSQL database.

Handles MCP-specific communication (POST for client-to-server, GET for server-to-client notifications via SSE, DELETE for session termination).

Uses StreamableHTTPServerTransport to manage the HTTP/SSE communication with the GeminiMCPClient.

Google Gemini LLM:

An external service that the GeminiMCPClient interacts with.

Responsible for Natural Language Understanding (NLU), deciding which tool to use, extracting parameters, and generating human-like responses.

PostgreSQL Database (on Neon):

The core data store for customers, products, and orders.

Neon provides a serverless, scalable, and highly available PostgreSQL instance, making it ideal for dynamic applications.

The lib/db.js utility (not provided, but inferred) handles the actual connection and execution of SQL queries.

Flow of Operations:
User Input: A user types a natural language query into the Next.js Frontend.

Frontend to API Gateway: The frontend sends this query to the /api/chat endpoint on the backend/server.js (API Gateway) via HTTP or WebSocket.

API Gateway to GeminiMCPClient: The backend/server.js passes the user's message to its internal GeminiMCPClient instance.

Gemini Tool Selection: The GeminiMCPClient sends the user's query and a list of available tools (with their descriptions and schemas) to the Google Gemini LLM. Gemini determines the user's intent and identifies the most suitable tool and its parameters.

Tool Execution Request (MCP): If a tool is selected, the GeminiMCPClient makes an MCP callTool request to the mcp-express-server/index.js. This communication occurs over Streamable HTTP or SSE.

Tool Execution (Database Interaction): The mcp-express-server receives the tool call, validates the parameters using Zod, and executes the corresponding database query via the lib/db.js utility against the PostgreSQL Database (on Neon).

Tool Results (MCP Response): The database results are returned to the tool function, which then sends them back to the GeminiMCPClient via the MCP response mechanism.

Gemini Response Formatting: The GeminiMCPClient takes the raw tool results and the original user input, sends them back to the Google Gemini LLM for natural language formatting, transforming the structured data into a conversational response.

Final Response to Frontend: The formatted response is sent back from the GeminiMCPClient to the backend/server.js.

Frontend Display: The backend/server.js then sends this final response back to the Next.js Frontend (either via HTTP response or WebSocket message), which displays it to the user with dynamic rendering of tables and charts.

Chat History: The backend/server.js also saves the user's message and the AI's response to its in-memory chat history.

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

Run your database schema migrations (e.g., using psql, sequelize-cli, knex, or a custom script) to create the customers, products, orders, and order_items tables with appropriate primary/foreign keys and cascade delete rules.

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

Examples:

"Show me the top 5 customers by revenue."

"What products are currently out of stock?"

"Create a new customer named 'Alice Wonderland' with email alice@example.com."

"Update product ID 10 to have a price of 29.99."

"Delete customer ID 101."

"Create an order for customer 5 with product ID 1 (quantity 2) and product ID 3 (quantity 1)."

"Summarize sales for 'Laptop'."

The AI agent will process your request, interact with the database, and provide a conversational response.

Observe real-time updates and responses via the WebSocket connection.

Explore the "Tools" tab to see all available database operations and even execute them directly.

Toggle between light and dark mode for your preferred viewing experience.

Contributing
(Add guidelines for contributions here, e.g., how to set up a development environment, run tests, submit pull requests.)

License
(Specify your project's license, e.g., MIT, Apache 2.0.)

Contact
(Your contact information or preferred method of communication.)