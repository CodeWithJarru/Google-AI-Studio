const http = require('http');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const API_KEY = "AIzaSyCp0tYJWlnrp4zVcrNaPT4lrIlz7-pvnYU";
if (!API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is not set.');
  console.error('Please create a .env file in the root directory and add: GEMINI_API_KEY=your_api_key');
  console.error('You can get your API key from https://aistudio.google.com/app/apikey');
  process.exit(1);
}

const ai = new GoogleGenerativeAI(API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
const chat = model.startChat();

const PORT = process.env.PORT || 3000;

async function handleGeminiMessage(userInput) {
  const result = await chat.sendMessage(userInput);
  const response = await result.response;
  return response.text();
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET') {
    let filePath = './public' + req.url;
    if (filePath === './public/') {
      filePath = './public/index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    }[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>', 'utf-8');
        } else {
          res.writeHead(500);
          res.end(`Sorry, check with the site admin for error: ${error.code} ..\n`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }

  else if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const data = JSON.parse(body);
      const userMessage = data.message;

      if (!userMessage) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Message is required' }));
        return;
      }

      const geminiReply = await handleGeminiMessage(userMessage);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reply: geminiReply }));
    });
  }

  else {
    res.writeHead(405, { 'Content-Type': 'text/html' });
    res.end('<h1>405 Method Not Allowed</h1>', 'utf-8');
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Open your browser and navigate to http://localhost:3000');
});
