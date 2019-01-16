const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

const linkPreview = require ('./urlThumbnailRequest');


var pattern = new RegExp('([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?([^ ])+');

// Connect to mongo
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;
            let id = Date.now().toString();
            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {

                // link preview integration
                if(urlValidation(message)){
                    chat.insert({name: name, message: message, id : id }, function(){
                        client.emit('output', [data]);

                        // Send status object
                        sendStatus({
                            message: 'Message sent',
                            clear: true
                        });
                    });
                    var urlData;
                    linkPreview.startDiscover(pattern.exec(message)[0],function(results){
                        urlData = results;
                        console.log('This is url data: ',urlData);
                        
                        //#region Solution1
                        /*chat.insert({name: name, message: message, link : urlData.link, title: urlData.title, img: urlData.img}, function(){
                           client.emit('output', [data]);
    
                            // Send status object
                            sendStatus({
                                message: 'Message sent',
                                clear: true
                            });
                        });*/
                        //#endregion
                    
                        socket.emit('updates', (urlData,id));
                    })
                    

                }else{
                    // Insert SIMPLE message
                    chat.insert({name: name, message: message}, function(){
                        client.emit('output', [data]);

                        // Send status object
                        sendStatus({
                            message: 'Message sent',
                            clear: true
                        });
                    });
                }
                
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});

var urlValidation = (url) => {
    return pattern.test(url);
}