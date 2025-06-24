import { z } from 'zod';

import { ExpressHttpStreamableMcpServer } from "./index.js";

const PORT = process.env.PORT || 3001;

console.log("Initializing MCP Streamable-HTTP Server with Express")


const servers = ExpressHttpStreamableMcpServer(
  {
    name: "streamable-mcp-server",
  },
  server => {


    server.tool(
      'calculate_sum',
      'A simple tool that calculate sum of numbers',
      {
        a: z.number().describe('Fisrt number to add'),
        b: z.number().describe('Second number to add'),
      },
      async ({ a, b }) => {
        console.log(`Tool Called: calculate sum (numbers=${a, b})`);
        return {
          content: [
            {
              type: 'text',
              text: `Sum of two number is, ${a + b}!`,
            },
          ],
        };
      }
    );


    server.tool(
      'greet',
      'A simple greeting tool',
      {
        name: z.string().describe('Name to greet'),
      },
      async ({ name }) => {
        console.log(`Tool Called: greet (name=${name})`);
        return {
          content: [
            {
              type: 'text',
              text: `Hello, ${name}!`,
            },
          ],
        };
      }
    );


    server.tool(
      'get_session',
      'gets the session id and context',
      {},
      async ({ }) => {
        return {
          content: [
            {
              type: 'text',
              text: `session`,
            },
          ],
        };
      }
    );

    // Register a tool that sends multiple greetings with notifications
    server.tool(
      'multi-greet',
      'A tool that sends different greetings with delays between them',
      {
        name: z.string().describe('Name to greet'),
      },
      async ({ name }, { sendNotification }) => {
        console.log(`Tool Called: multi-greet (name=${name})`);
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        await sendNotification({
          method: "notifications/message",
          params: { level: "debug", data: `Starting multi-greet for ${name}` }
        });

        await sleep(1000); // Wait 1 second before first greeting

        await sendNotification({
          method: "notifications/message",
          params: { level: "info", data: `Sending first greeting to ${name}` }
        });

        await sleep(1000); // Wait another second before second greeting

        await sendNotification({
          method: "notifications/message",
          params: { level: "info", data: `Sending second greeting to ${name}` }
        });

        return {
          content: [
            {
              type: 'text',
              text: `Good morning, ${name}!`,
            }
          ],
        };
      }
    );
  })