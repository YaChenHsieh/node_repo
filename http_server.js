const http = require("http");
const server = http.createServer((request, response) => {
  response.writeHead(200, {
    "content-type": "text/html"
  });

  response.end(`<div> Hello <br>  ${request.url}  </div>`);
});

server.listen(3000);
