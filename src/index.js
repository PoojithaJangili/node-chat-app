const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New WebSocket connection!')

    // socket.emit('message', generateMessage('Welcome!'))
    // socket.broadcast.emit('message', generateMessage('A new user has joined!'))
    
    // socket.emit('message', {
        //     text: 'Welcome!',
        //     createdAt: new Date().getTime()
        // })
        // socket.emit('message', "Welcome New Client!")
        // socket.broadcast.emit('message', 'A new user has joined!')
        
        // socket.on('join', ({ username, room }, callback) => {
        //     const { error, user } = addUser({ id: socket.id, username, room })
        socket.on('join', (options, callback) => {
            const { error, user } = addUser({ id: socket.id, ...options })

            if(error) {
                return callback(error)
            }

            socket.join(user.room)
            // socket.join(room)
            
            socket.emit('message', generateMessage('Admin', 'Welcome!'))
            socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
            // socket.broadcast.to(room).emit('message', generateMessage(`${username} has joined!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })

            callback()

        //  socket.emit, io.emit, socket.broadcast.emit
        //  io.to.emit, socket.broadcast.to.emit  ---> to a specific chat room members
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()

        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        // io.to('India').emit('message', generateMessage(message))
        // io.emit('message', generateMessage(message))
        callback('Delivered!!')
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        // io.emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        // io.emit('message', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)

        // socket.emit('locationMessage', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
        // io.emit('message', `Location: ${coords.latitude}, ${coords.longitude}`)

        callback()
        // callback('Location Shared!!')

    })
    // socket.on('sendLocation', (coords) => {
    //     io.emit('message', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
    //     // io.emit('message', `Location: ${coords.latitude}, ${coords.longitude}`)
    // })


    // when a given socket gets disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
})


// let count = 0

// io.on('connection', (socket) => {
//     console.log('New WebSocket connection!')

//     socket.emit('countUpdated', count)

//     socket.on('increment', () => {
//         count++
//         // socket.emit('countUpdated', count)  ---> emits event to that specific connection
//         io.emit('countUpdated', count)   //---> emits event to every single connection
//     })
// })

// io.on('connection', () => {
//     console.log('New WebSocket connection!')
// })

server.listen(port, () => {
    console.log('Server is up on port ' + port)
})