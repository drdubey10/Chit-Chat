const express = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data.js");
const cors = require("cors");
const connectDB = require("./config/db.js");
const userRoutes = require("./routes/userRoutes.js");
const chatRoutes = require("./routes/chatRoutes.js");
const messageRoutes = require("./routes/messageRoutes.js")
const path = require('path')

const { notFound, errorHandler } = require("./middleware/errorMiddleware.js")




const app = express();

app.use(express.json());


app.use(cors());
dotenv.config();
connectDB();




app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use("/api/message",messageRoutes);


const __dirname1 =  path.resolve();

if(process.env.NODE_ENV === "production"){

    app.use(express.static(path.join(__dirname1,"/client/build")));
    
    app.get('*' , (req , res) => {
        res.sendFile(path.resolve(__dirname1,"client", "build", "index.html"))
    })

}
else{
    app.get('/', (req, res) => {
        res.send("api is running");
    
    })
}


app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 8000

const server = app.listen(PORT, console.log("server started on port 8000"))
const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
      origin: "http://localhost:3000",
      // credentials: true,
    },
  });



io.on("connection",(socket)=>{
    console.log("connected to socket .io");

    socket.on("setup",(userData)=>{
        socket.join(userData._id);
        // console.log(userData._id);
        socket.emit('connected')
    })
    socket.on('join chat',(room)=>{
        socket.join(room);
        console.log(room);
        // socket.emit('connected')
    })
    socket.on('new message',(newMessageRecieved)=>{
        var chat = newMessageRecieved.chat;
        if(!chat.users) return console.log('chatusers not defined')

        chat.users.forEach(user=>{
            if(user._id== newMessageRecieved.sender._id) return
            socket.in(user._id).emit("message recieved",newMessageRecieved)
        })
    })
})