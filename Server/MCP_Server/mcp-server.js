
// This file is part of the MCP Streamable-HTTP Server example using Express.
import { z } from 'zod';
import { ExpressHttpStreamableMcpServer } from "./index.js";
import { query } from './lib/db.js';

const PORT = process.env.PORT || 3001;
console.log("Initializing MCP Streamable-HTTP Server with Express");

const servers = ExpressHttpStreamableMcpServer(
  {
    name: "streamable-mcp-server",
  },
  server => {

    server.tool(
      'get_customers',
      'Retrieves customer information. Can filter by customer ID, first name, last name, or email.',
      {
        customer_id: z.number().int().optional().describe('Optional: ID of the customer to retrieve.'),
        first_name: z.string().optional().describe('Optional: First name of the customer.'),
        last_name: z.string().optional().describe('Optional: Last name of the customer.'),
        email: z.string().email().optional().describe('Optional: Email of the customer.'),
        phone: z.string().optional().describe('Optional: Phone number of the customer.'),
        city: z.string().optional().describe('Optional: City of the customer.'),
        state: z.string().optional().describe('Optional: State of the customer.'),
        limit: z.number().int().min(1).max(100).default(10).describe('Maximum number of customers to retrieve. Default is 10.'),
      },
      async (params = {}) => {
        console.log(`Tool Called: get_customers with params:`, params);
        let sql = 'SELECT customer_id, first_name, last_name, email, phone, city, state FROM customers WHERE 1=1';
        const queryParams = [];
        let paramIndex = 1;

        if (params.customer_id) {
          sql += ` AND customer_id = $${paramIndex++}`;
          queryParams.push(params.customer_id);
        }
        if (params.first_name) {
          sql += ` AND first_name ILIKE $${paramIndex++}`;
          queryParams.push(`%${params.first_name}%`);
        }
        if (params.last_name) {
          sql += ` AND last_name ILIKE $${paramIndex++}`;
          queryParams.push(`%${params.last_name}%`);
        }
        if (params.email) {
          sql += ` AND email ILIKE $${paramIndex++}`;
          queryParams.push(`%${params.email}%`);
        }
        if (params.phone) {
          sql += ` AND phone ILIKE $${paramIndex++}`;
          queryParams.push(`%${params.phone}%`);
        }
        if (params.city) {
          sql += ` AND city ILIKE $${paramIndex++}`;
          queryParams.push(`%${params.city}%`);
        }
        if (params.state) {
          sql += ` AND state ILIKE $${paramIndex++}`;
          queryParams.push(`%${params.state}%`);
        }

        sql += ` LIMIT $${paramIndex++}`;
        queryParams.push(params.limit || 10);

        try {
          const customers = await query(sql, queryParams);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(customers),
              description: 'Customer data retrieved successfully.'
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error retrieving customer data: ${error.message}`
            }]
          };
        }
      }
    );

    server.tool(
      'get_products',
      'Retrieves product information. Can filter by product ID, name, or price range.',
      {
        product_id: z.number().int().optional().describe('Optional: ID of the product to retrieve.'),
        product_name: z.string().optional().describe('Optional: Name of the product.'),
        min_price: z.number().positive().optional().describe('Optional: Minimum price for products.'),
        max_price: z.number().positive().optional().describe('Optional: Maximum price for products.'),
        limit: z.number().int().min(1).max(100).default(10).describe('Maximum number of products to retrieve. Default is 10.'),
      },
      async (params = {}) => {
        console.log(`Tool Called: get_products with params:`, params);
        let sql = 'SELECT product_id, product_name, description, price, stock_quantity FROM products WHERE 1=1';
        const queryParams = [];
        let paramIndex = 1;

        if (params.product_id) {
          sql += ` AND product_id = $${paramIndex++}`;
          queryParams.push(params.product_id);
        }
        if (params.product_name) {
          sql += ` AND product_name ILIKE $${paramIndex++}`;
          queryParams.push(`%${params.product_name}%`);
        }
        if (params.min_price) {
          sql += ` AND price >= $${paramIndex++}`;
          queryParams.push(params.min_price);
        }
        if (params.max_price) {
          sql += ` AND price <= $${paramIndex++}`;
          queryParams.push(params.max_price);
        }
        sql += ` LIMIT $${paramIndex++}`;
        queryParams.push(params.limit || 10);

        try {
          const products = await query(sql, queryParams);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(products),
              description: 'Product data retrieved successfully.'
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error retrieving product data: ${error.message}`
            }]
          };
        }
      }
    );

    server.tool(
      'get_orders',
      'Retrieves order information. Can filter by order ID, customer ID, or date range.',
      {
        order_id: z.number().int().optional().describe('Optional: ID of the order to retrieve.'),
        customer_id: z.number().int().optional().describe('Optional: ID of the customer who placed the order.'),
        start_date: z.string().datetime().optional().describe('Optional: Start date for order filtering (ISO 8601 format).'),
        end_date: z.string().datetime().optional().describe('Optional: End date for order filtering (ISO 8601 format).'),
        status: z.string().optional().describe('Optional: Status of the order (e.g., "pending", "completed", "cancelled").'),
        limit: z.number().int().min(1).max(100).default(10).describe('Maximum number of orders to retrieve. Default is 10.'),
      },
      async (params = {}) => {
        console.log(`Tool Called: get_orders with params:`, params);
        let sql = 'SELECT order_id, customer_id, order_date, total_amount, status FROM orders WHERE 1=1';
        const queryParams = [];
        let paramIndex = 1;

        if (params.order_id) {
          sql += ` AND order_id = $${paramIndex++}`;
          queryParams.push(params.order_id);
        }
        if (params.customer_id) {
          sql += ` AND customer_id = $${paramIndex++}`;
          queryParams.push(params.customer_id);
        }
        if (params.start_date) {
          sql += ` AND order_date >= $${paramIndex++}`;
          queryParams.push(params.start_date);
        }
        if (params.end_date) {
          sql += ` AND order_date <= $${paramIndex++}`;
          queryParams.push(params.end_date);
        }
        if (params.status) {
          sql += ` AND status ILIKE $${paramIndex++}`;
          queryParams.push(`%${params.status}%`);
        }
        sql += ` ORDER BY order_date DESC LIMIT $${paramIndex++}`;
        queryParams.push(params.limit || 10);

        try {
          const orders = await query(sql, queryParams);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(orders),
              description: 'Order data retrieved successfully.'
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error retrieving order data: ${error.message}`
            }]
          };
        }
      }
    );

    server.tool(
      'get_customer_orders',
      'Retrieves all orders for a specific customer, including product details.',
      {
        customer_id: z.number().int().describe('The ID of the customer whose orders to retrieve.'),
        limit: z.number().int().min(1).max(100).default(10).describe('Maximum number of orders to retrieve. Default is 10.'),
      },
      async (params) => {
        console.log(`Tool Called: get_customer_orders with params:`, params);
        const sql = `
          SELECT
            o.order_id,
            o.order_date,
            o.total_amount,
            o.status,
            p.product_name,
            oi.quantity,
            p.price AS product_price
          FROM orders o
          JOIN order_items oi ON o.order_id = oi.order_id
          JOIN products p ON oi.product_id = p.product_id
          WHERE o.customer_id = $1
          ORDER BY o.order_date DESC
          LIMIT $2;
        `;
        const queryParams = [params.customer_id, params.limit || 10];

        try {
          const customerOrders = await query(sql, queryParams);
          if (customerOrders.length === 0) {
            return {
              content: [{
                type: 'text',
                text: `No orders found for customer ID ${params.customer_id}.`
              }]
            };
          }
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(customerOrders),
              description: `Orders for customer ID ${params.customer_id} retrieved successfully.`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error retrieving orders for customer ID ${params.customer_id}: ${error.message}`
            }]
          };
        }
      }
    );

    server.tool(
      'get_product_sales_summary',
      'Retrieves a summary of sales for products, showing total quantity sold and total revenue. Can filter by product name.',
      {
        product_name: z.string().optional().describe('Optional: Name of the product to get sales summary for.'),
        limit: z.number().int().min(1).max(100).default(10).describe('Maximum number of products in the summary. Default is 10.'),
      },
      async (params = {}) => {
        console.log(`Tool Called: get_product_sales_summary with params:`, params);
        let sql = `
          SELECT
            p.product_name,
            SUM(oi.quantity) AS total_quantity_sold,
            SUM(oi.quantity * p.price) AS total_revenue
          FROM products p
          JOIN order_items oi ON p.product_id = oi.product_id
          WHERE 1=1
        `;
        const queryParams = [];
        let paramIndex = 1;

        if (params.product_name) {
          sql += ` AND p.product_name ILIKE $${paramIndex++}`;
          queryParams.push(`%${params.product_name}%`);
        }
        sql += ` GROUP BY p.product_name ORDER BY total_revenue DESC LIMIT $${paramIndex++}`;
        queryParams.push(params.limit || 10);

        try {
          const salesSummary = await query(sql, queryParams);
          if (salesSummary.length === 0) {
            return {
              content: [{
                type: 'text',
                text: `No sales data found for the specified product(s).`
              }]
            };
          }
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(salesSummary),
              description: 'Product sales summary retrieved successfully.'
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error retrieving product sales summary: ${error.message}`
            }]
          };
        }
      }
    );

    // CRUD Operations for Customers
    server.tool(
      'create_customer',
      'Creates a new customer in the database.',
      {
        first_name: z.string().min(1).describe('First name of the new customer.'),
        last_name: z.string().min(1).optional().describe('Optional: Last name of the new customer.'),
        email: z.string().email().optional().describe('Optional: Email of the new customer (must be unique).'),
        phone: z.string().optional().describe('Optional: Phone number of the new customer.'),
        address: z.string().optional().describe('Optional: Address of the new customer.'),
        city: z.string().optional().describe('Optional: City of the new customer.'),
        state: z.string().optional().describe('Optional: State of the new customer.'),
        zip_code: z.string().optional().describe('Optional: Zip code of the new customer.'),
      },
      async (params) => {
        console.log(`Tool Called: create_customer with params:`, params);
        const { first_name, last_name, email, phone, address, city, state, zip_code } = params;
        const sql = `
          INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zip_code)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING customer_id, first_name, last_name, email;
        `;
        const queryParams = [first_name, last_name, email, phone, address, city, state, zip_code];

        try {
          const newCustomer = await query(sql, queryParams);
          if (newCustomer.length > 0) {
            return {
              content: [{
                type: 'text',
                text: `Customer created successfully with ID: ${newCustomer[0].customer_id}. Details: ${JSON.stringify(newCustomer[0])}`,
                description: 'New customer created.'
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `Failed to create customer.`
              }]
            };
          }
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error creating customer: ${error.message}`
            }]
          };
        }
      }
    );

    server.tool(
      'update_customer',
      'Updates an existing customer in the database by customer ID.',
      {
        customer_id: z.number().int().describe('ID of the customer to update.'),
        first_name: z.string().min(1).optional().describe('Optional: New first name of the customer.'),
        last_name: z.string().min(1).optional().describe('Optional: New last name of the customer.'),
        email: z.string().email().optional().describe('Optional: New email of the customer (must be unique).'),
        phone: z.string().optional().describe('Optional: New phone number of the customer.'),
        address: z.string().optional().describe('Optional: New address of the customer.'),
        city: z.string().optional().describe('Optional: New city of the customer.'),
        state: z.string().optional().describe('Optional: New state of the customer.'),
        zip_code: z.string().optional().describe('Optional: New zip code of the customer.'),
      },
      async (params) => {
        console.log(`Tool Called: update_customer with params:`, params);
        const { customer_id, ...updates } = params;
        const setClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        for (const key in updates) {
          if (updates[key] !== undefined) {
            setClauses.push(`${key} = $${paramIndex++}`);
            queryParams.push(updates[key]);
          }
        }

        if (setClauses.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No update fields provided for customer ID ${customer_id}.`
            }]
          };
        }

        queryParams.push(customer_id);
        const sql = `
          UPDATE customers
          SET ${setClauses.join(', ')}
          WHERE customer_id = $${paramIndex}
          RETURNING customer_id, first_name, last_name, email;
        `;

        try {
          const updatedCustomer = await query(sql, queryParams);
          if (updatedCustomer.length > 0) {
            return {
              content: [{
                type: 'text',
                text: `Customer ID ${customer_id} updated successfully. Details: ${JSON.stringify(updatedCustomer[0])}`,
                description: 'Customer updated.'
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `Customer with ID ${customer_id} not found or no changes were made.`
              }]
            };
          }
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error updating customer ID ${customer_id}: ${error.message}`
            }]
          };
        }
      }
    );

    server.tool(
      'delete_customer',
      'Deletes a customer from the database by customer ID. This will also delete related orders and order items due to CASCADE delete.',
      {
        customer_id: z.number().int().describe('ID of the customer to delete.'),
      },
      async (params) => {
        console.log(`Tool Called: delete_customer with params:`, params);
        const { customer_id } = params;
        const sql = `DELETE FROM customers WHERE customer_id = $1 RETURNING customer_id;`;

        try {
          const deletedCustomer = await query(sql, [customer_id]);
          if (deletedCustomer.length > 0) {
            return {
              content: [{
                type: 'text',
                text: `Customer with ID ${customer_id} and associated data deleted successfully.`,
                description: 'Customer deleted.'
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `Customer with ID ${customer_id} not found.`
              }]
            };
          }
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error deleting customer ID ${customer_id}: ${error.message}`
            }]
          };
        }
      }
    );

    // CRUD Operations for Products
    server.tool(
      'add_product',
      'Adds a new product to the database.',
      {
        product_name: z.string().min(1).describe('Name of the new product.'),
        description: z.string().optional().describe('Optional: Description of the new product.'),
        price: z.number().positive().describe('Price of the new product.'),
        stock_quantity: z.number().int().min(0).describe('Current stock quantity of the new product.'),
      },
      async (params) => {
        console.log(`Tool Called: add_product with params:`, params);
        const { product_name, description, price, stock_quantity } = params;
        const sql = `
          INSERT INTO products (product_name, description, price, stock_quantity)
          VALUES ($1, $2, $3, $4)
          RETURNING product_id, product_name, price;
        `;
        const queryParams = [product_name, description, price, stock_quantity];

        try {
          const newProduct = await query(sql, queryParams);
          if (newProduct.length > 0) {
            return {
              content: [{
                type: 'text',
                text: `Product "${newProduct[0].product_name}" added successfully with ID: ${newProduct[0].product_id}.`,
                description: 'New product added.'
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `Failed to add product.`
              }]
            };
          }
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error adding product: ${error.message}`
            }]
          };
        }
      }
    );

    server.tool(
      'update_product',
      'Updates an existing product in the database by product ID.',
      {
        product_id: z.number().int().describe('ID of the product to update.'),
        product_name: z.string().min(1).optional().describe('Optional: New name of the product.'),
        description: z.string().optional().describe('Optional: New description of the product.'),
        price: z.number().positive().optional().describe('Optional: New price of the product.'),
        stock_quantity: z.number().int().min(0).optional().describe('Optional: New stock quantity of the product.'),
      },
      async (params) => {
        console.log(`Tool Called: update_product with params:`, params);
        const { product_id, ...updates } = params;
        const setClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        for (const key in updates) {
          if (updates[key] !== undefined) {
            setClauses.push(`${key} = $${paramIndex++}`);
            queryParams.push(updates[key]);
          }
        }

        if (setClauses.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No update fields provided for product ID ${product_id}.`
            }]
          };
        }

        queryParams.push(product_id);
        const sql = `
          UPDATE products
          SET ${setClauses.join(', ')}
          WHERE product_id = $${paramIndex}
          RETURNING product_id, product_name, price, stock_quantity;
        `;

        try {
          const updatedProduct = await query(sql, queryParams);
          if (updatedProduct.length > 0) {
            return {
              content: [{
                type: 'text',
                text: `Product ID ${product_id} updated successfully. Details: ${JSON.stringify(updatedProduct[0])}`,
                description: 'Product updated.'
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `Product with ID ${product_id} not found or no changes were made.`
              }]
            };
          }
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error updating product ID ${product_id}: ${error.message}`
            }]
          };
        }
      }
    );

    server.tool(
      'delete_product',
      'Deletes a product from the database by product ID. This will also delete related order items due to CASCADE delete, but will not delete orders themselves.',
      {
        product_id: z.number().int().describe('ID of the product to delete.'),
      },
      async (params) => {
        console.log(`Tool Called: delete_product with params:`, params);
        const { product_id } = params;
        const sql = `DELETE FROM products WHERE product_id = $1 RETURNING product_id;`;

        try {
          const deletedProduct = await query(sql, [product_id]);
          if (deletedProduct.length > 0) {
            return {
              content: [{
                type: 'text',
                text: `Product with ID ${product_id} and associated order items deleted successfully.`,
                description: 'Product deleted.'
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `Product with ID ${product_id} not found.`
              }]
            };
          }
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error deleting product ID ${product_id}: ${error.message}`
            }]
          };
        }
      }
    );

    /**
     * Tool to create a new order in the database.
     * This tool also handles creating order items.
     */
    server.tool(
      'create_order',
      'Creates a new order in the database, optionally including order items for products.',
      {
        customer_id: z.number().int().describe('ID of the customer placing the order.'),
        order_date: z.string().datetime().optional().describe('Optional: Date of the order (ISO 8601 format). Defaults to current timestamp.'),
        status: z.enum(['pending', 'completed', 'cancelled']).default('pending').describe('Optional: Status of the order. Defaults to "pending".'),
        products: z.array(z.object({
          product_id: z.number().int().describe('ID of the product in the order.'),
          quantity: z.number().int().min(1).describe('Quantity of the product.'),
        })).optional().describe('Optional: Array of products and quantities for this order.')
      },
      async (params) => {
        console.log(`Tool Called: create_order with params:`, params);
        const { customer_id, order_date, status, products } = params;

        let totalAmount = 0;
        let productDetails = [];

        // Fetch product prices to calculate total_amount and validate products
        if (products && products.length > 0) {
          const productIds = products.map(p => p.product_id);
          const productSql = `SELECT product_id, price FROM products WHERE product_id = ANY($1::int[]);`;
          const fetchedProducts = await query(productSql, [productIds]);

          if (fetchedProducts.length !== productIds.length) {
            const foundIds = fetchedProducts.map(p => p.product_id);
            const missingIds = productIds.filter(id => !foundIds.includes(id));
            return {
              content: [{
                type: 'text',
                text: `Error: One or more products not found: ${missingIds.join(', ')}.`,
                description: 'Product not found error.'
              }]
            };
          }

          productDetails = products.map(p => {
            const fetchedProduct = fetchedProducts.find(fp => fp.product_id === p.product_id);
            if (!fetchedProduct) {
              throw new Error(`Product with ID ${p.product_id} not found.`); // Should not happen with the check above
            }
            const itemPrice = fetchedProduct.price * p.quantity;
            totalAmount += itemPrice;
            return { productId: p.product_id, quantity: p.quantity, itemPrice: itemPrice };
          });
        }

        const orderSql = `
          INSERT INTO orders (customer_id, order_date, total_amount, status)
          VALUES ($1, $2, $3, $4)
          RETURNING order_id, customer_id, order_date, total_amount, status;
        `;
        const orderParams = [customer_id, order_date || new Date().toISOString(), totalAmount, status];

        try {
          const newOrder = await query(orderSql, orderParams);
          if (newOrder.length === 0) {
            return {
              content: [{
                type: 'text',
                text: `Failed to create order.`
              }]
            };
          }

          const orderId = newOrder[0].order_id;

          // Insert order items
          if (productDetails.length > 0) {
            const itemInsertPromises = productDetails.map(item => {
              const itemSql = `
                INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
                VALUES ($1, $2, $3, $4);
              `;
              // Use the actual product price at the time of order
              const originalProductPrice = fetchedProducts.find(fp => fp.product_id === item.productId).price;
              return query(itemSql, [orderId, item.productId, item.quantity, originalProductPrice]);
            });
            await Promise.all(itemInsertPromises);
          }

          return {
            content: [{
              type: 'text',
              text: `Order created successfully with ID: ${orderId}. Total amount: ${totalAmount}. Details: ${JSON.stringify(newOrder[0])}`,
              description: 'New order created.'
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error creating order: ${error.message}`
            }]
          };
        }
      }
    );

    /**
     * Tool to update an existing order in the database.
     * Can update status and recalculate total amount if products are changed.
     * This tool does NOT allow adding/removing individual order items directly;
     * it's for updating the order's top-level details. For item management,
     * separate tools would be needed.
     */
    server.tool(
      'update_order',
      'Updates an existing order in the database by order ID. Can update status and total amount. This tool does not modify individual order items, only the top-level order details.',
      {
        order_id: z.number().int().describe('ID of the order to update.'),
        status: z.enum(['pending', 'completed', 'cancelled']).optional().describe('Optional: New status of the order.'),
        total_amount: z.number().positive().optional().describe('Optional: New total amount for the order.'),
      },
      async (params) => {
        console.log(`Tool Called: update_order with params:`, params);
        const { order_id, ...updates } = params;
        const setClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        for (const key in updates) {
          if (updates[key] !== undefined) {
            setClauses.push(`${key} = $${paramIndex++}`);
            queryParams.push(updates[key]);
          }
        }

        if (setClauses.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No update fields provided for order ID ${order_id}.`
            }]
          };
        }

        queryParams.push(order_id);
        const sql = `
          UPDATE orders
          SET ${setClauses.join(', ')}
          WHERE order_id = $${paramIndex}
          RETURNING order_id, customer_id, order_date, total_amount, status;
        `;

        try {
          const updatedOrder = await query(sql, queryParams);
          if (updatedOrder.length > 0) {
            return {
              content: [{
                type: 'text',
                text: `Order ID ${order_id} updated successfully. Details: ${JSON.stringify(updatedOrder[0])}`,
                description: 'Order updated.'
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `Order with ID ${order_id} not found or no changes were made.`
              }]
            };
          }
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error updating order ID ${order_id}: ${error.message}`
            }]
          };
        }
      }
    );

    /**
     * Tool to delete an order from the database.
     */
    server.tool(
      'delete_order',
      'Deletes an order from the database by order ID. This will also delete related order items.',
      {
        order_id: z.number().int().describe('ID of the order to delete.'),
      },
      async (params) => {
        console.log(`Tool Called: delete_order with params:`, params);
        const { order_id } = params;
        const sql = `DELETE FROM orders WHERE order_id = $1 RETURNING order_id;`;

        try {
          const deletedOrder = await query(sql, [order_id]);
          if (deletedOrder.length > 0) {
            return {
              content: [{
                type: 'text',
                text: `Order with ID ${order_id} and associated order items deleted successfully.`,
                description: 'Order deleted.'
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `Order with ID ${order_id} not found.`
              }]
            };
          }
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error deleting order ID ${order_id}: ${error.message}`
            }]
          };
        }
      }
    );

    // --- Complex Data Handling / Reporting Tools ---

    /**
     * Tool to retrieve the top N customers by total spending.
     */
    server.tool(
      'get_top_customers_by_spending',
      'Retrieves the top N customers based on their total spending across all orders.',
      {
        limit: z.number().int().min(1).max(100).default(5).optional().describe('Optional: Number of top customers to retrieve. Default is 5.'),
      },
      async (params) => {
        console.log(`Tool Called: get_top_customers_by_spending with params:`, params);
        const limit = params?.limit || 5;
        const sql = `
          SELECT
            c.customer_id,
            c.first_name,
            c.last_name,
            c.email,
            SUM(o.total_amount) AS total_spent
          FROM customers c
          JOIN orders o ON c.customer_id = o.customer_id
          GROUP BY c.customer_id, c.first_name, c.last_name, c.email
          ORDER BY total_spent DESC
          LIMIT $1;
        `;
        const queryParams = [limit];

        try {
          const topCustomers = await query(sql, queryParams);
          if (topCustomers.length === 0) {
            return {
              content: [{
                type: 'text',
                text: `No customer spending data found.`
              }]
            };
          }
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(topCustomers),
              description: `Top ${limit} customers by spending retrieved successfully.`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error retrieving top customers by spending: ${error.message}`
            }]
          };
        }
      }
    );

    /**
     * Tool to retrieve monthly sales revenue for a given year.
     */
    server.tool(
      'get_monthly_sales_revenue',
      'Retrieves the total sales revenue for each month in a specified year. If no year is provided, it defaults to the current year.',
      {
        year: z.number().int().min(2000).max(new Date().getFullYear()).optional().describe('Optional: The year for which to retrieve monthly sales. Defaults to the current year.'),
      },
      async (params) => {
        console.log(`Tool Called: get_monthly_sales_revenue with params:`, params);
        const year = params?.year || new Date().getFullYear();
        const sql = `
          SELECT
            EXTRACT(MONTH FROM order_date) AS month,
            SUM(total_amount) AS monthly_revenue
          FROM orders
          WHERE EXTRACT(YEAR FROM order_date) = $1
          GROUP BY month
          ORDER BY month;
        `;
        const queryParams = [year];

        try {
          const monthlySales = await query(sql, queryParams);
          if (monthlySales.length === 0) {
            return {
              content: [{
                type: 'text',
                text: `No sales data found for the year ${year}.`
              }]
            };
          }
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(monthlySales),
              description: `Monthly sales revenue for ${year} retrieved successfully.`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error retrieving monthly sales revenue: ${error.message}`
            }]
          };
        }
      }
    );

    /**
     * Tool to get product inventory levels and highlight low stock items.
     */
    server.tool(
      'get_inventory_status',
      'Retrieves the current stock quantity for all products and can highlight products with low stock.',
      {
        low_stock_threshold: z.number().int().min(0).optional().describe('Optional: Threshold below which a product is considered low stock. Default is 10.'),
      },
      async (params) => {
        console.log(`Tool Called: get_inventory_status with params:`, params);
        const lowStockThreshold = params?.low_stock_threshold || 10;
        let sql = `
          SELECT
            product_id,
            product_name,
            stock_quantity,
            CASE
              WHEN stock_quantity <= $1 THEN 'Low Stock'
              ELSE 'In Stock'
            END AS stock_status
          FROM products
          ORDER BY stock_quantity ASC;
        `;
        const queryParams = [lowStockThreshold];

        try {
          const inventory = await query(sql, queryParams);
          if (inventory.length === 0) {
            return {
              content: [{
                type: 'text',
                text: `No product inventory data found.`
              }]
            };
          }
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(inventory),
              description: 'Product inventory status retrieved successfully.'
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error retrieving inventory status: ${error.message}`
            }]
          };
        }
      }
    );


    /**
     * This tool is designed to be called by the LLM (Gemini) to present data in a structured format
     * (text, table, or chart) based on the data provided and the user's query/preferences.
     */
    server.tool(
      'format_data_for_display',
      'Formats given JSON data into a displayable format (text, table, or chart) based on user query and data suitability. This tool is designed to be called by the LLM (Gemini) to present data.',
      {
        data: z.array(z.record(z.any())).describe('The JSON data (array of objects) to be formatted.'),
        user_query: z.string().describe('The original user query that led to this data.'),
        preferred_format: z.enum(['text', 'table', 'bar_chart', 'line_chart', 'pie_chart']).optional().describe('Optional: The user preferred display format. If not specified by LLM, the tool will suggest based on data.').default('text'),
        title: z.string().optional().describe('Optional: Title for the table or chart.'),
        x_label: z.string().optional().describe('Optional: X-axis label for charts.'),
        y_label: z.string().optional().describe('Optional: Y-axis label for charts.'),
        value_column: z.string().optional().describe('Optional: The column to use for values in a chart (e.g., "total_revenue").'),
        label_column: z.string().optional().describe('Optional: The column to use for labels in a chart (e.g., "product_name").'),
      },
      async (params) => {
        console.log(`Tool Called: format_data_for_display with params:`, params);
        const { data, user_query, preferred_format, title, x_label, y_label, value_column, label_column } = params;

        if (!data || data.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No data available to format for: "${user_query}".`
            }]
          };
        }

        // Determine the actual format to return. Prioritize preferred_format from LLM.
        let finalFormat = preferred_format;
        let formattedOutput;

        // Basic heuristic for default format if preferred_format from LLM is 'text' or not clearly a chart
        // The LLM should be smart enough to request a chart.
        if (finalFormat === 'text') {
          formattedOutput = {
            display_type: 'text',
            content: JSON.stringify(data, null, 2),
            title: title || `Response for: ${user_query}`
          };
        } else {
          // Check if data is suitable for a chart based on the LLM's request
          const canBeChart = data.every(row => {
            const keys = Object.keys(row);
            return (value_column && keys.includes(value_column) && typeof row[value_column] === 'number') &&
              (label_column && keys.includes(label_column));
          });

          // If the LLM requested a chart and the data appears suitable
          if (canBeChart && ['bar_chart', 'line_chart', 'pie_chart'].includes(finalFormat)) {
            const chartData = data.map(item => ({
              label: item[label_column],
              value: item[value_column]
            }));

            formattedOutput = {
              display_type: 'chart',
              chart_type: finalFormat,
              title: title || `Chart for: ${user_query}`,
              x_label: x_label || label_column,
              y_label: y_label || value_column,
              data: chartData
            };
          } else {
            // Default to table if chart not suitable or preferred format is table
            const columns = data.length > 0 ? Object.keys(data[0]) : [];
            formattedOutput = {
              display_type: 'table',
              title: title || `Table for: ${user_query}`,
              columns: columns,
              data: data
            };
          }
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(formattedOutput),
            description: `Formatted data for display as ${formattedOutput.display_type}.`
          }]
        };
      }
    );
  }
);

export default servers;