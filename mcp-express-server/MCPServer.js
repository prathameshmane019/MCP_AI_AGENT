// // server/mcp-server.js
// import { z } from 'zod';
// import { ExpressHttpStreamableMcpServer } from "./mcp-transport.js";

// const PORT = process.env.PORT || 3001;

// console.log("Initializing Enhanced MCP Streamable-HTTP Server with Express");

// const servers = ExpressHttpStreamableMcpServer(
//   {
//     name: "enhanced-mcp-server",
//     version: "1.0.0"
//   },
//   server => {
//     // Enhanced calculator tool
//     server.tool(
//       'calculate',
//       'Advanced calculator that supports multiple operations',
//       {
//         operation: z.enum(['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt']).describe('Mathematical operation to perform'),
//         a: z.number().describe('First number'),
//         b: z.number().optional().describe('Second number (not required for sqrt)'),
//       },
//       async ({ operation, a, b }) => {
//         console.log(`Tool Called: calculate (operation=${operation}, a=${a}, b=${b})`);
        
//         let result;
//         try {
//           switch (operation) {
//             case 'add':
//               result = a + (b || 0);
//               break;
//             case 'subtract':
//               result = a - (b || 0);
//               break;
//             case 'multiply':
//               result = a * (b || 1);
//               break;
//             case 'divide':
//               if (b === 0) throw new Error('Division by zero');
//               result = a / b;
//               break;
//             case 'power':
//               result = Math.pow(a, b || 2);
//               break;
//             case 'sqrt':
//               if (a < 0) throw new Error('Cannot calculate square root of negative number');
//               result = Math.sqrt(a);
//               break;
//             default:
//               throw new Error('Unknown operation');
//           }

//           return {
//             content: [
//               {
//                 type: 'text',
//                 text: `Result: ${result}`,
//               },
//             ],
//           };
//         } catch (error) {
//           return {
//             content: [
//               {
//                 type: 'text',
//                 text: `Error: ${error.message}`,
//               },
//             ],
//           };
//         }
//       }
//     );

//     // Enhanced greeting tool
//     server.tool(
//       'greet',
//       'Personalized greeting tool with different styles',
//       {
//         name: z.string().describe('Name to greet'),
//         style: z.enum(['formal', 'casual', 'enthusiastic', 'professional']).default('casual').describe('Greeting style'),
//         language: z.enum(['en', 'es', 'fr', 'de']).default('en').describe('Language for greeting'),
//       },
//       async ({ name, style, language }) => {
//         console.log(`Tool Called: greet (name=${name}, style=${style}, language=${language})`);
        
//         const greetings = {
//           en: {
//             formal: `Good day, ${name}. It's a pleasure to meet you.`,
//             casual: `Hey ${name}! How's it going?`,
//             enthusiastic: `Hello ${name}! Great to see you! 🎉`,
//             professional: `Good morning/afternoon, ${name}. I hope you're having a productive day.`
//           },
//           es: {
//             formal: `Buenos días, ${name}. Es un placer conocerle.`,
//             casual: `¡Hola ${name}! ¿Cómo estás?`,
//             enthusiastic: `¡Hola ${name}! ¡Qué bueno verte! 🎉`,
//             professional: `Buenos días/tardes, ${name}. Espero que tenga un día productivo.`
//           },
//           fr: {
//             formal: `Bonjour, ${name}. C'est un plaisir de vous rencontrer.`,
//             casual: `Salut ${name}! Comment ça va?`,
//             enthusiastic: `Bonjour ${name}! Ravi de vous voir! 🎉`,
//             professional: `Bonjour, ${name}. J'espère que vous passez une bonne journée.`
//           },
//           de: {
//             formal: `Guten Tag, ${name}. Es ist mir eine Freude, Sie kennenzulernen.`,
//             casual: `Hallo ${name}! Wie geht's?`,
//             enthusiastic: `Hallo ${name}! Schön dich zu sehen! 🎉`,
//             professional: `Guten Tag, ${name}. Ich hoffe, Sie haben einen produktiven Tag.`
//           }
//         };

//         return {
//           content: [
//             {
//               type: 'text',
//               text: greetings[language][style],
//             },
//           ],
//         };
//       }
//     );

//     // System information tool
//     server.tool(
//       'get_system_info',
//       'Get system information including session details',
//       {
//         info_type: z.enum(['session', 'server', 'tools']).default('session').describe('Type of information to retrieve'),
//       },
//       async ({ info_type }, { sessionId, sendNotification }) => {
//         console.log(`Tool Called: get_system_info (info_type=${info_type})`);
        
//         let info;
//         switch (info_type) {
//           case 'session':
//             info = {
//               sessionId: sessionId || 'unknown',
//               timestamp: new Date().toISOString(),
//               uptime: process.uptime(),
//             };
//             break;
//           case 'server':
//             info = {
//               name: "enhanced-mcp-server",
//               version: "1.0.0",
//               nodeVersion: process.version,
//               platform: process.platform,
//               memory: process.memoryUsage(),
//             };
//             break;
//           case 'tools':
//             info = {
//               availableTools: ['calculate', 'greet', 'get_system_info', 'text_analysis', 'multi_step_task'],
//               totalTools: 5,
//             };
//             break;
//         }

//         if (sendNotification) {
//           await sendNotification({
//             method: "notifications/message",
//             params: { 
//               level: "info", 
//               data: `System info requested: ${info_type}` 
//             }
//           });
//         }

//         return {
//           content: [
//             {
//               type: 'text',
//               text: JSON.stringify(info, null, 2),
//             },
//           ],
//         };
//       }
//     );

//     // Text analysis tool
//     server.tool(
//       'text_analysis',
//       'Analyze text for various properties',
//       {
//         text: z.string().describe('Text to analyze'),
//         analysis_type: z.enum(['word_count', 'char_count', 'sentiment', 'readability']).describe('Type of analysis to perform'),
//       },
//       async ({ text, analysis_type }) => {
//         console.log(`Tool Called: text_analysis (text length=${text.length}, analysis_type=${analysis_type})`);
        
//         let result;
//         switch (analysis_type) {
//           case 'word_count':
//             result = {
//               words: text.split(/\s+/).filter(word => word.length > 0).length,
//               characters: text.length,
//               charactersNoSpaces: text.replace(/\s/g, '').length,
//             };
//             break;
//           case 'char_count':
//             result = {
//               total: text.length,
//               letters: (text.match(/[a-zA-Z]/g) || []).length,
//               digits: (text.match(/\d/g) || []).length,
//               spaces: (text.match(/\s/g) || []).length,
//               punctuation: (text.match(/[^\w\s]/g) || []).length,
//             };
//             break;
//           case 'sentiment':
//             // Simple sentiment analysis based on positive/negative words
//             const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'happy', 'love', 'like'];
//             const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'frustrated'];
            
//             const sentimentWords = text.toLowerCase().split(/\s+/);
//             const positive = sentimentWords.filter(word => positiveWords.includes(word)).length;
//             const negative = sentimentWords.filter(word => negativeWords.includes(word)).length;
            
//             let sentiment = 'neutral';
//             if (positive > negative) sentiment = 'positive';
//             else if (negative > positive) sentiment = 'negative';
            
//             result = {
//               sentiment,
//               positiveWords: positive,
//               negativeWords: negative,
//               score: positive - negative,
//             };
//             break;
//           case 'readability':
//             const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
//             const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
//             const syllables = text.toLowerCase().replace(/[^a-z]/g, '').replace(/[aeiou]/g, 'X').replace(/X+/g, 'X').length;
            
//             // Simple Flesch Reading Ease approximation
//             const fleschScore = 206.835 - (1.015 * (wordCount / sentences)) - (84.6 * (syllables / wordCount));
            
//             result = {
//               sentences,
//               words: wordCount,
//               averageWordsPerSentence: Math.round(wordCount / sentences * 100) / 100,
//               estimatedSyllables: syllables,
//               fleschReadingEase: Math.round(fleschScore * 100) / 100,
//               readingLevel: fleschScore > 90 ? 'Very Easy' : 
//                            fleschScore > 80 ? 'Easy' :
//                            fleschScore > 70 ? 'Fairly Easy' :
//                            fleschScore > 60 ? 'Standard' :
//                            fleschScore > 50 ? 'Fairly Difficult' :
//                            fleschScore > 30 ? 'Difficult' : 'Very Difficult'
//             };
//             break;
//         }

//         return {
//           content: [
//             {
//               type: 'text',
//               text: JSON.stringify(result, null, 2),
//             },
//           ],
//         };
//       }
//     );

//     // Multi-step task tool with notifications
//     server.tool(
//       'multi_step_task',
//       'Execute a multi-step task with progress notifications',
//       {
//         task_name: z.string().describe('Name of the task to execute'),
//         steps: z.number().min(1).max(10).default(3).describe('Number of steps to simulate'),
//         delay: z.number().min(100).max(5000).default(1000).describe('Delay between steps in milliseconds'),
//       },
//       async ({ task_name, steps, delay }, { sendNotification }) => {
//         console.log(`Tool Called: multi_step_task (task=${task_name}, steps=${steps}, delay=${delay})`);
        
//         const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
//         const results = [];

//         if (sendNotification) {
//           await sendNotification({
//             method: "notifications/message",
//             params: { 
//               level: "info", 
//               data: `Starting task: ${task_name} with ${steps} steps` 
//             }
//           });
//         }

//         for (let i = 1; i <= steps; i++) {
//           const stepResult = `Step ${i} completed: Processing ${task_name}`;
//           results.push(stepResult);

//           if (sendNotification) {
//             await sendNotification({
//               method: "notifications/message",
//               params: { 
//                 level: "debug", 
//                 data: `Progress: ${i}/${steps} - ${stepResult}` 
//               }
//             });
//           }

//           if (i < steps) {
//             await sleep(delay);
//           }
//         }

//         if (sendNotification) {
//           await sendNotification({
//             method: "notifications/message",
//             params: { 
//               level: "info", 
//               data: `Task completed: ${task_name}` 
//             }
//           });
//         }

//         return {
//           content: [
//             {
//               type: 'text',
//               text: `Task "${task_name}" completed successfully!\n\nResults:\n${results.join('\n')}`,
//             },
//           ],
//         };
//       }
//     );
//   }
// );

// export default servers;