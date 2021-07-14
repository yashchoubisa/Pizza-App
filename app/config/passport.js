const LocalStratergy = require('passport-local').Strategy
const User = require('../models/user');
const bcrypt = require('bcrypt');

function init(passport) {
    passport.use(new LocalStratergy({ usernameField: 'email' }, async (email, password, done) => {
        //Login
        //Check if email exists
        const user = await User.findOne({email : email})
        if (!user) {
            return done(null, false, { message: 'No User with email' });
        } else {
            bcrypt.compare(password, user.password).then(match => {
                if (match) {
                    return done(null, user, { message: 'Logged in successfully' })
                }
                return done(null, false, { message: 'Wrogn Username or password' })
            }).catch(error => {
                return done(null, false, { message: 'Something went wrong' })
            })
        }
    }));
    passport.serializeUser((user, done) => {
        done(null, user._id)
    });
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user)
        });
    });
}

module.exports = init