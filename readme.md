# 🤖 AI-Powered Database Explorer
 
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13+-black.svg)](https://nextjs.org/)

> **Redefining database interaction through natural language powered by Google Gemini AI**

A cutting-edge application that empowers users to perform sophisticated queries, complex analytical operations, and comprehensive data management on PostgreSQL databases using plain English. Built with Google Gemini AI, Model Context Protocol (MCP), and Streamable HTTP for unprecedented real-time database interaction.

---

## ✨ **Key Highlights**

🚀 **Natural Language Database Queries** - Interact with your database using intuitive plain English  
🧠 **AI-Powered Tool Orchestration** - Intelligent tool selection and parameter extraction  
⚡ **Real-time Communication** - WebSocket-based instant responses and updates  
📊 **Dynamic Visualizations** - Auto-generated charts and tables from query results  
🔒 **Enterprise-Ready** - Secure, scalable architecture with robust validation  
🌐 **Cloud-Native** - Built for modern cloud deployments with Neon PostgreSQL  

---

## 🏗️ **System Architecture**

```mermaid
graph TD
    A[👤 User Browser] -->|Natural Language Query| B[🖥️ Next.js Frontend]
    
    subgraph "🔄 Backend API Gateway"
        B -->|HTTP/WebSocket| C[🌐 Express.js Server]
        C -->|Orchestration| D[🤖 Gemini MCP Client]
        C -->|Real-time Updates| B
    end
    
    subgraph "🧠 AI Orchestration Layer"
        D -->|Tool Selection| E[🔮 Google Gemini LLM]
        E -->|Tool Invocation| F[🔧 MCP Express Server]
    end
    
    subgraph "💾 Database Layer"
        F -->|Business Tools| G[⚙️ Custom Tools]
        G -->|SQL Queries| H[🐘 PostgreSQL Neon]
    end
    
    H -->|Results| G
    G -->|Structured Data| F
    F -->|MCP Response| E
    E -->|Natural Language| D
    D -->|Formatted Response| C
    C -->|JSON/WebSocket| B
    
    style A fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    style B fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style C fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style D fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    style E fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    style F fill:#e0f2f7,stroke:#03a9f4,stroke-width:2px
    style G fill:#fbe9e7,stroke:#ff5722,stroke-width:2px
    style H fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
```

### 🔧 **Component Overview**

| Component | Technology | Role |
|-----------|------------|------|
| **Frontend** | Next.js + ShadCN UI | Interactive user interface with real-time visualizations |
| **API Gateway** | Express.js + Socket.IO | Secure proxy with rate limiting and WebSocket support |
| **AI Orchestrator** | Gemini + MCP Client | Natural language processing and tool selection |
| **MCP Server** | Node.js + MCP SDK | Business tool hosting and database interaction |
| **Database** | PostgreSQL on Neon | Scalable, serverless data storage |

---

## 🚀 **Features**

### 💬 **Natural Language Interface**
- **Intuitive Queries**: "Show me top 5 customers by revenue"
- **Complex Operations**: "Create an order for John with 3 laptops and 2 mice"
- **Analytics**: "Generate sales summary for Q4 with charts"

### 🤖 **Advanced AI Agent**
- **Intelligent Tool Selection**: AI automatically chooses the right database operations
- **Parameter Extraction**: Converts natural language to structured parameters
- **Context Awareness**: Maintains conversation context for follow-up queries

### 📊 **Dynamic Visualizations**
- **Auto-Generated Charts**: Bar, pie, and line charts from query results
- **Interactive Tables**: Sortable and filterable data displays
- **Real-time Updates**: Live data refresh with WebSocket connections

### 🔧 **Comprehensive Business Tools**
- **Smart Data Retrieval**: Filtered searches and linked data fetching
- **Full CRUD Operations**: Create, read, update, delete with business logic
- **Analytical Reporting**: Complex summaries and business insights
- **Data Validation**: Zod-powered schema validation

### 🛡️ **Security & Performance**
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Robust parameter validation
- **Secure Headers**: Helmet.js security middleware
- **CORS Protection**: Controlled cross-origin access

---

## 🛠️ **Technology Stack**

### **AI & Orchestration**
- **Google Gemini API** - Natural language understanding
- **Model Context Protocol (MCP)** - Structured AI-tool communication
- **Streamable HTTP** - Real-time tool invocation transport

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **Zod** - TypeScript-first schema validation
- **PostgreSQL (pg)** - Database client

### **Database**
- **PostgreSQL** - Relational database system
- **Neon** - Serverless PostgreSQL platform

### **Frontend**
- **Next.js** - React framework
- **ShadCN UI** - Modern component library
- **Recharts** - Data visualization library
- **Lucide React** - Icon library

---

## 📋 **Prerequisites**

- **Node.js** 18.0 or higher
- **PostgreSQL** database (Neon recommended)
- **Google Gemini API** key
- **npm** or **yarn** package manager

---

## ⚙️ **Installation & Setup**

### 1. **Clone Repository**
```bash
git clone https://github.com/yourusername/ai-database-explorer.git
cd ai-database-explorer
```

### 2. **Environment Configuration**

Create `.env` files in the respective directories:

#### **Backend Configuration** (`.env`)
```env
# Server Configuration
BACKEND_PORT=3002
FRONTEND_URL=http://localhost:3000

# MCP Server Configuration
MCP_BASE_URL=http://localhost:3001/mcp

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
```

### 3. **Database Setup**

#### **Create Neon Database**
1. Sign up at [Neon.tech](https://neon.tech)
2. Create a new PostgreSQL database
3. Copy the connection string to your `.env` file

#### **Database Schema**
```sql
-- Create tables with proper relationships
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);
```

### 4. **Install Dependencies**

#### **MCP Server**
```bash
cd mcp-express-server
npm install
```

#### **Backend API Gateway**
```bash
cd backend
npm install
```

#### **Frontend**
```bash
cd frontend
npm install
```

### 5. **Start Services**

#### **Terminal 1: MCP Server**
```bash
cd mcp-express-server
npm start
# or
node index.js
```

#### **Terminal 2: Backend API Gateway**
```bash
cd backend
npm start
# or
node server.js
```

#### **Terminal 3: Frontend**
```bash
cd frontend
npm run dev
```

---

## 🎯 **Usage Examples**

### **Basic Queries**
```
"Show me all customers"
"What products do we have in stock?"
"Display the last 10 orders"
```

### **Complex Analytics**
```
"Show me the top 5 customers by total order value"
"What's the average order value for each month this year?"
"Generate a sales report for laptops with a pie chart"
```

### **Data Management**
```
"Create a new customer named John Doe with email john@example.com"
"Add 50 units to the laptop inventory"
"Update order #123 status to completed"
```

### **Business Intelligence**
```
"Which products are running low on stock?"
"Show me revenue trends for the last 6 months"
"Create a comprehensive sales dashboard"
```

---

## 🔧 **Available Business Tools**

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `get_customers` | Retrieve customer data with filters | "Show active customers from this month" |
| `create_customer` | Add new customer records | "Create customer for Sarah Connor" |
| `get_products` | Product inventory and details | "List products under $100" |
| `create_order` | Process complex orders | "Create order with multiple items" |
| `get_sales_summary` | Generate analytical reports | "Monthly sales summary with charts" |
| `update_inventory` | Manage stock levels | "Update laptop stock to 25 units" |

---

## 🌟 **Advanced Features**

### **Real-time Collaboration**
- Live user count display
- Concurrent query execution
- Shared session management

### **Data Visualization**
- Automatic chart type selection
- Interactive data exploration
- Export capabilities

### **Tool Management**
- Direct tool execution interface
- Parameter validation preview
- Execution history tracking

---

## 🚀 **Deployment**

### **Production Environment Variables**
```env
NODE_ENV=production
BACKEND_PORT=3002
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=your_production_database_url
GEMINI_API_KEY=your_production_api_key
```

### **Docker Deployment** (Optional)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["node", "server.js"]
```

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Development Guidelines**
- Follow ESLint configuration
- Add tests for new features
- Update documentation
- Ensure backward compatibility

 
## 📞 **Support & Contact**

- **GitHub Issues**: [Create an issue](https://github.com/prathameshmane/MCP_AI_AGENT/issues)
- **Email**: maneprathamesh.email@gmai.com
- **Documentation**: [Wiki](https://github.com/prathameshmane/MCP_AI_AGENT)

---

## 🙏 **Acknowledgments**

- **Google Gemini** for providing powerful AI capabilities
- **Neon** for serverless PostgreSQL hosting
- **Model Context Protocol** for structured AI communication
- **Open Source Community** for the amazing tools and libraries

---

<div align="center">

**⭐ Star this repository if you find it useful!**

[Report Bug](https://github.com/yourusername/ai-database-explorer/issues) · [Request Feature](https://github.com/yourusername/ai-database-explorer/issues) · [Documentation](https://github.com/yourusername/ai-database-explorer/wiki)

</div>
