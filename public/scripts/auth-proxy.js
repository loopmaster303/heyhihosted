const https = require('https');
const url = require('url');

// Standard STDIN Proxy Implementation
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const requestData = JSON.parse(inputData);
    const { url: requestUrl, method = 'POST', headers = {}, body, stream = false } = requestData;

    // We can trust headers passed from parent (which includes clean key)
    
    // Explicitly set Content-Length if body exists
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    // Use global URL parsing (proven to work)
    const parsedUrl = new URL(requestUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      if (stream) {
        process.stdout.write(JSON.stringify({
          type: 'meta',
          status: res.statusCode,
          headers: res.headers,
          contentType: res.headers['content-type'] || 'application/octet-stream'
        }) + '\n');

        res.on('data', (chunk) => {
          process.stdout.write(JSON.stringify({
            type: 'chunk',
            dataBase64: chunk.toString('base64'),
          }) + '\n');
        });

        res.on('end', () => {
          process.stdout.write(JSON.stringify({ type: 'end' }) + '\n');
        });

        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const fullBuffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || 'application/octet-stream';
        
        console.log(JSON.stringify({
          status: res.statusCode,
          headers: res.headers,
          bodyBase64: fullBuffer.toString('base64'),
          contentType
        }));
      });
    });

    req.on('error', (e) => {
      const payload = JSON.stringify({ type: stream ? 'error' : 'stderr', error: e.message });
      if (stream) {
        process.stdout.write(payload + '\n');
      } else {
        console.error(payload);
        process.exit(1);
      }
    });

    if (body) req.write(body);
    req.end();

  } catch (err) {
    console.error(JSON.stringify({ error: 'Proxy Input Error: ' + err.message }));
    process.exit(1);
  }
});
