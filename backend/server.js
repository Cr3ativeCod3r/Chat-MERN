const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const initializeChat = require('./chat');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectDB = require('./config/db');
connectDB();

app.use('/api/auth', authRoutes);

initializeChat(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));