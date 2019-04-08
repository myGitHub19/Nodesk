const mongoClient = require('mongodb').MongoClient
const crypto = require('crypto')
const dataBase = 'learning-node';
var dataBaseURL = 'mongodb://tyler:node2520@ds125073.mlab.com:25073/learning-node'
 
// Models, and inserts a new chat into the database
var createChat = (users,callback) =>{
    mongoClient.connect(dataBaseURL, { useNewUrlParser:true }, (err, client) => {
        // access the database
        const database = client.db(dataBase);
        // get the 'chats' table
        var chatsCollection = database.collection('chats')
        var userCollection = database.collection('users')
        var chatId = crypto.randomBytes(10).toString('hex');
        // create a model for the chat, this will allow easy, predictable database entries
        var chatModel = {'_id':chatId,messages : [],users : users}

        // userCollection.distinct("username", (dbUsernames) => {
            // console.log(dbUsernames);
            users.forEach(user => {
                userCollection.findOne(({"username" : user}), (err, data) => {
                    console.log(data.username)
                    if(data.username !== user){
                        var e = Error(`User ${user} does not exist`)
                        e.name = 'UserError'
                        throw e
                    }
                    
                })
            });
        // })
        chatsCollection.insertOne(chatModel,(err,result)=>{
            users.forEach(user=>{
                userCollection.update({username:user},{$push:{chatids:result.insertedId}}
                )
            })
            callback(result.insertedId)
        })
        
    })
}

var getChatUsers = (chatid, callback)=>{
    mongoClient.connect(dataBaseURL, { useNewUrlParser:true }, (err, client) => {
        // access the database
        const database = client.db(dataBase);
        // get the 'chats' table
        var userCollection = database.collection('chats')
        // create a model for the chat, this will allow easy, predictable database entries
        userCollection.findOne(({"_id":chatid}),(err,data)=>{
            callback(data.users);
        })
    })
}

var getChatIDs = (username,callback) => {
    mongoClient.connect(dataBaseURL, { useNewUrlParser:true }, (err, client) => {
        // access the database
        const database = client.db(dataBase);
        // get the 'chats' table
        var userCollection = database.collection('users')
        // create a model for the chat, this will allow easy, predictable database entries
        userCollection.findOne(({"username":username}),(err,data)=>{    
            callback(data.users);
        })
    })
}
module.exports = {createChat,getChatIDs,getChatUsers};   