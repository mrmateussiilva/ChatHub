const venom = require('venom-bot');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server }); // WebSocket ligado ao servidor HTTP

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Servir arquivos estáticos

let messages = [];
let clients = [];

venom.create({ session: 'session-name', multidevice: true })
  .then(client => start(client))
  .catch(err => console.log(err));

function start(client) {
  console.log("📲 Bot iniciado!");

  client.onMessage((message) => {
    console.log(`[${message.sender.pushname}] ${message.body}`);

    const newMessage = { sender: message.sender.pushname, text: message.body };
    messages.push(newMessage);

    // Enviar a nova mensagem para todos os clientes conectados via WebSocket
    clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(newMessage));
      }
    });
  });

  // Rota para acessar mensagens já recebidas
  app.get('/messages', (req, res) => res.json(messages));

  // Rota para servir o painel web
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  server.listen(3000, () => console.log("🚀 API rodando em http://localhost:3000"));
}

// Configuração do WebSocket
wss.on('connection', (ws) => {
  console.log("🟢 Novo cliente conectado!");
  clients.push(ws);

  ws.on('close', () => {
    console.log("🔴 Cliente desconectado!");
    clients = clients.filter(client => client !== ws);
  });
});
