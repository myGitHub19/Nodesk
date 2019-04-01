// Node modules
const server = require('http').createServer();
const fs = require('fs');
const qs = require('querystring');
const url = require('url');

// Environment Variables
const port = process.env.PORT || 8000
var connectedUsers = [];

// Our modules
const hashPassword = require('./hashString').createHash;
const getBody = require('./getBodyData').getBody;
const createChat =  require('./chat').createChat;
const message = require('./messages');
const registerUser = require('./userRegistration').registerUser;
const createKey = require('./createSocketKey').createKey;
const parseBuffer = require('./parseBuffer').parseBuffer;
const constructBuffer = require('./constructBuffer').constructBuffer;


server.on('request', (req, res) => {
    switch (req.url) {

        case '/':
            res.writeHead(200, {'Content-Type': 'image/jpeg,text/html'});
            res.write(fs.readFileSync('./Public/images/lighthouse.jpg'));          
            res.end(fs.readFileSync(`./Public/index.html`));
            break;

        case '/messages':
            res.writeHead(200, { 'Content-Type': 'application/json' });
            const username = url.parse(req.url, true).username;
            const messages = getMessages(username);
            res.end(JSON.stringify(messages));
            break;

        case '/chat':
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(fs.readFileSync(`./Public/chat.html`));

            res.end();
            break;

        case '/register':
            // If /register is accessed by a POST method we'll initiate the registration process
            if (req.method === 'POST') {
                getBody((body) => {
                    try {
                        body = qs.parse(body);
                        registerUser(body.username, body.email, body.passwordCheck);
                        res.writeHead(200);            
                        res.end();
                    } catch (e) {
                        console.log(e)
                        res.writeHead(400);            
                        res.end();
                    }
                });  
            }
            // If /register is accessed by any other method, we're going to reroute them to the homepage
            res.writeHead(301, { 'Location': '/' });
            res.end();
            break;
        
        case '/login':
            if (req.method === 'POST') {
                getBody((body) => {
                    body = qs.parse(body);
                    let password = hashPassword(body.passwordCheck)
                    const username = authenticateUser(body.email, password);
                    if (!username) {
                        res.writeHead(400);
                        res.end();
                    } else {
                        res.setHead('Set-Cookie', [`Max-Age=1`])
                        res.writeHead(301, { 'Location': '/chat' });
                        res.end();
                    }
                });
            } else {
                res.writeHead(301, { 'Location': '/' });
                res.end();
            }
            break;

        // If they attempt to go somewhere that doesn't exist
        default:
            res.writeHead(404);
            res.end();
    }
});

server.on('upgrade', (req, socket) => {

    // I want to write this section into a function
    if (req.url !== '/messages'){
        socket.end('HTTP/1.1 400 Bad Request');
        return;
    }

    if (req.headers['upgrade'] !== 'websocket') {
        socket.end('HTTP/1.1 400 Bad Request');
        return;
    }
    
    let userKey = req.headers['sec-websocket-key'];
    const serverKey = createKey(userKey);

    const responseHeader = [ 
        'HTTP/1.1 101 Web Socket Protocol Handshake', 
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${serverKey}`,
        'Sec-WebSocket-Protocol: json'];
    // I want to write this section into a function

    // This establishes the connection and turns the current TCP socket
    // into a websocket
    socket.write(responseHeader.join('\r\n') + '\r\n\r\n'); // I want to make a socket.acceptWebsocket function
    
    // Grab the user's username and get all the chatIds they're linked to
    // Then push to connectedUsers a local object that stores:
    // the UserIds, ChatIds and socket they're connected to.
    // userChatIDs = getChatIDs(userID);
    // let user = {
    //     userID : 'something',
    //     chatIDs : userChatIDs,
    //     sock : socket.ref()
    // }
    // connectedUsers.push(user)
        

    socket.on('data', buffer => {
        try {
            // Parses the buffer data received from client
            const userMessage = parseBuffer(buffer)
            console.log(userMessage)
            // We stringify the data then pass it into constructBuffer

            const messageString = JSON.stringify(userMessage)
            const serverMessage = constructBuffer(messageString)

            // This will echo the message back to the client
            socket.write(serverMessage)

            // This sends the user message in json format to the database

            // User auth and sending user info has to be implemented first
            // addMessage(userMessage)

            //TODO maintain a list of userIDs that are connected
            //TODO sendToOnlineClients(serverMessage);
            //TODO security and stuff

        } catch (e) {
            // I've thrown a couple errors in parseBuffer instead of returning null.
            // That way we can include a logging functionality if we want.
            console.log(e.message)
        }
    });

});
            

server.listen(port);