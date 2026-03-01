const http = require('http');

const data = JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
});

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/accounts/authenticate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Testing authentication route: POST http://localhost:4000/api/accounts/authenticate');

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    let responseBody = '';
    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:');
        try {
            console.log(JSON.stringify(JSON.parse(responseBody), null, 2));
        } catch (e) {
            console.log(responseBody);
        }
    });
});

req.on('error', (error) => {
    console.error('Error connecting to the server:', error.message);
    console.log('\nMake sure your server is running on port 4000.');
});

req.write(data);
req.end();
