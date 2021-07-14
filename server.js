require('dotenv').config();
const express = require('express');
const app = express();

const PORT = process.env.PORT || 300;
const ejs = require('ejs');
const expressLayout = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('express-flash');
const Emitter = require('events');

const MongoDbStore = require('connect-mongo')(session)
const passport = require('passport');


//Database connection
const url = 'mongodb+srv://yashCh:7gf5EfYuUxpa7MrM@cluster0.0rmzb.mongodb.net/pizza?retryWrites=true&w=majority';
mongoose.connect(url, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: true });
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('Database Connected');
}).catch(err => {
    console.log('Database Connection failed');
});


//Session store
let mongoStore = new MongoDbStore({
    mongooseConnection: connection,
    collection : 'sessions'
})

//Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)
//Session Config
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: mongoStore,
    saveUninitialized: false,
    cookie : {maxAge: 1000 * 60 *60 * 24} //24 hours
}))
//Always passport config after session
//Passport Config
const passportInit = require('./app/config/passport');
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

//assets
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }))
app.use(express.json());

//Global Middleware
app.use((req, res, next) => {
    res.locals.session = req.session
    res.locals.user = req.user
    next()
});

app.use(expressLayout);
app.set('views', path.join(__dirname, '/resources/views'));
app.set('view engine', 'ejs');

require('./routes/web')(app);

const server = app.listen(PORT, () => {
    console.log('helo');
})

//Socket
const io = require('socket.io')(server)
io.on('connection', (socket) => {
    //Join
    socket.on('join', (orderId) => {
        socket.join(orderId)
    })

});

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data);
});
eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data);
});