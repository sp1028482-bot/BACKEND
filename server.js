const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let connectedDevices = {}; // { socketId: deviceName }

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // जब फोन ऐप रजिस्टर हो
  socket.on('register-device', (deviceName) => {
    connectedDevices[socket.id] = deviceName;
    console.log(`Device registered: ${deviceName} (${socket.id})`);
    io.emit('update-device-list', connectedDevices);
  });

  // जब आप वेबसाइट से उस फोन को लाइव देखने के लिए क्लिक करें
  socket.on('start-stream', (targetSocketId) => {
    console.log(`Stream requested for device: ${targetSocketId}`);
    io.to(targetSocketId).emit('request-stream', socket.id);
  });

  // WebRTC Signaling (Offer, Answer, ICE Candidates)
  socket.on('offer', (data) => {
    io.to(data.target).emit('offer', { offer: data.offer, sender: socket.id });
  });

  socket.on('answer', (data) => {
    io.to(data.target).emit('answer', { answer: data.answer, sender: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.target).emit('ice-candidate', { candidate: data.candidate, sender: socket.id });
  });

  // जब कोई डिवाइस या डैशबोर्ड डिस्कनेक्ट हो
  socket.on('disconnect', () => {
    if (connectedDevices[socket.id]) {
      console.log(`Device disconnected: ${connectedDevices[socket.id]}`);
      delete connectedDevices[socket.id];
      io.emit('update-device-list', connectedDevices);
    } else {
      console.log('Client disconnected:', socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server is running on port ${PORT}`);
});
