const http = require('http');
const fs = require('fs');

      http.createServer((request,response)=>{
          if(request.url  !=='/')  return;
          fs.writeFile(  __dirname+  '/header01.json',
                         JSON.stringify(request.headers),
                         error=>{
                            if(error)
                                return console.log('error');

                                   });


          fs.readFile(__dirname+  '/data01.html',
              (error, data)=>{

                  if (error) {
                      response.writeHead(500, {'Content-Type': 'text/plain'});
                      response.end('500-Server錯誤');
                             }
                  else {
                      response.writeHead(200, {'Content-Type': 'text/html'});
                      response.end(data);
                  }
      });

      }).listen(3000);