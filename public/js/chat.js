// 1 => untuk memanggil fun
const socket = io();
// socket.on('countUpdate', count => {
//   console.log('Count has been Updated!', count);
// });

// //2
// // .emit => untuk mengirim / send
// // .on => untuk mendengarkan /listen
// const increment = document
//   .querySelector('#increment')
//   .addEventListener('click', () => {
//     console.log('count has been increased');
//     socket.emit('increment');
//   });

//chalenge

//2-1

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Tempates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Auto scroll
const autoScroll = () => {
  //New message element
  const $newMessage = $messages.lastElementChild;

  //Height of the new message
  const newMessageStyles = getComputedStyle($newMessage); // untuk cek style yang diinginkan dgn cara di console.log
  const newMessageMargin = parseInt(newMessageStyles.marginBottom); // mengubah string ke integer
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //Visible height
  const visibleHeight = $messages.offsetHeight;

  //Height of the message container
  const containerHeight = $messages.scrollHeight;

  //How far have i scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

//Options
//Qs berasal dari library libs qs
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

socket.on('message', message => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

//locationMessage listener
socket.on('locationMessage', msg => {
  const html = Mustache.render(locationTemplate, {
    username: msg.username,
    url: msg.url, //.text itu hanya variable , nama bisa diganti apa aja
    createdAt: moment(msg.createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

//End locationMessage listener
$messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = $messageFormInput.value;

  //tambahan seting
  //to disable button from submit twice
  $messageFormButton.setAttribute('disabled', 'disabled');

  socket.emit('sendMessage', message, error => {
    //tambahan seting
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log('Message delivered!');
  });
});

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  document.querySelector('#sidebar').innerHTML = html;
});

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser!');
  }

  //seting tambahan
  $sendLocationButton.setAttribute('disabled', 'disabled');
  navigator.geolocation.getCurrentPosition(position => {
    // const latitude = position.coords.latitude;
    // const longitude = position.coords.longitude;

    socket.emit(
      'sendLocation',
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      () => {
        $sendLocationButton.removeAttribute('disabled');
      }
    );
  });
});

// data dari Qs yang sudah di definisikan diatas
socket.emit(
  'join',
  {
    username,
    room
  },
  error => {
    if (error) {
      alert(error);
      location.href = '/';
    }
  }
);
