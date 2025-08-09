const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server working on port 3003\n');
});

server.listen(3003, () => {
  console.log('Test server running on http://localhost:3003');
});