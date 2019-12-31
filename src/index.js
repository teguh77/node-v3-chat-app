const express = require('express'); //1
const app = express(); //1
const http = require('http'); //5
const socketio = require('socket.io'); //7
const Filter = require('bad-words'); //9
const {generateMessage, generateLocation} = require('./utils/messages');
const {addUser, removeUser, getUser, getUserInRoom} = require('./utils/users');

const port = process.env.PORT || 3000; //2

const path = require('path'); //3
const publicDirectoryPath = path.join(__dirname, '../public'); //3 => untuk menggabungkan nama folder dengan 'path'
// console.log(publicDirectoryPath);

const server = http.createServer(app); //6
const io = socketio(server); //8

//End Variables

app.use(express.static(publicDirectoryPath)); //4 => use middleware untuk seting default folder app

//7
io.on('connection', socket => {
  console.log('New WebSocket connection!');
  // emit => untuk mengirim sesuatu ke client
  // socket.emit('countUpdate', count); // jika ini socket diganti dgn io maka setiap kali connect dan ada client baru akan otomatis menerima data yag sudah di update
  // socket.on('increment', () => {
  //   count++;
  //   // socket.emit('countUpdate', count); // dgn menggunakan socket variable ini ketika server mengupdate maka tidak akan menguodate semua client secara realtime dan bersamaan
  //   io.emit('countUpdate', count); // ini akan menjadi solusinya
  // });

  //chalenge
  //2-2

  // //8
  // socket.emit('message', generateMessage('Welcome!'));
  // //mengirim ke semua client kecuali client yang baru join
  // //9
  // socket.broadcast.emit('message', generateMessage('A new user has joined!'));
  //telah di pindah dan dimasukkan ke fungsi yang dibawah ini

  //13
  socket.on('join', (options, callback) => {
    const {error, user} = addUser({
      id: socket.id,
      ...options /** isi sebenarnya => username, room */
    });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    //8
    socket.emit('message', generateMessage('Admin', 'Welcome!'));
    //mengirim ke semua client kecuali client yang baru join
    //9
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage(`${user.username} has joined!`));
    socket.to(user.room).emit('roomData', {
      room: user.room,
      users: getUserInRoom(user.room)
    });

    callback();
  });

  //listening from client with acknowledgement (callback)
  //11
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed!');
    }

    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback(); //memanggil fungsi callback yag ada di client (bisa ditambahkan argumen)
  });

  //share location listener
  // 12
  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id);
    const url = `https://google.com/maps?q=${location.latitude},${location.longitude}`;
    io.to(user.room).emit(
      'locationMessage',
      generateLocation(user.username, url)
    );
    callback();
  });

  //akan menampilkan pesan ketika user left
  //10
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('Admin', `${user.username} has left!`)
      );
      socket.to(user.room).emit('roomData', {
        room: user.room,
        users: getUserInRoom(user.room)
      });
    }
  });
});

//2
//app diganti dengan server
server.listen(port, () => {
  console.log(`Server is running on port ${port}!`);
});

//* acknowledgement => bentuk komunikasi antara server dan client, emit dan on
