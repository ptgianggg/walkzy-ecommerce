const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const routes = require("./routes");
const cors = require('cors');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");


const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: true, // cho phép mọi origin trong môi trường dev
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(cookieParser())


const path = require('path');
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

routes(app);


mongoose.connect(process.env.MONGO_DB)
    .then(() => {
        console.log("Connected Db success!!!")
    })
    .catch((err) => {
        console.log(err)
    })

if (process.env.GEMINI_API_KEY) {
    console.log(" Gemini API Key đã được cấu hình");
} else {
    console.log(" WARNING: GEMINI_API_KEY chưa được cấu hình trong file .env");
}

const http = require('http');
const { Server } = require('socket.io');
const chatSocket = require('./services/chatSocket');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'exp://*', 'http://*', 'https://*'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

chatSocket.init(io);
const qrSocket = require('./services/qrSocket');
qrSocket.init(io);

server.listen(port, '0.0.0.0', () => {
  console.log('Server is running on port:', port);
});


