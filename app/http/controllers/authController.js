const User = require('../../models/user');
const bcrypt = require('bcrypt');
const passport = require('passport');
// const { body, validationResult } = require('express-validator');

function authController() {
    const _getRedirectUrl = (req) => {
        return req.user.role === 'admin' ? '/admin/orders' : 'customer/orders';
    }
    return {
        login(req, res) {+
            res.render('auth/login');
        },
        authenticate(req, res, next) {
            const { email, password } = req.body;
            //Validate request 
            if (!email || !password) {
                req.flash('error', 'All fields are required');
                req.flash('email', email);
                return res.redirect('/login');
            }
            passport.authenticate('local', (err, user, info) => {
                if (err) {
                    req.flash('error', info.message)
                    return next(err)
                }
                if (!user) {
                    req.flash('error', info.message)
                    return res.redirect('/login');
                }
                req.logIn(user, (err) => {
                    if (err) {
                        req.flash('error', info.message)
                        return next(err)
                    }
                    return res.redirect(_getRedirectUrl(req))
                })
            })(req, res, next)
        },
        register(req, res) {
            res.render('auth/register');
        },
        async store(req, res) {
            const { name, email, password } = req.body;
            //Validate request 
            if (!name || !email || !password) {
                req.flash('error', 'All fields are required');
                req.flash('name', name);
                req.flash('email', email);
                return res.redirect('/register');
            }
            //Check id email exists
            User.exists({ email:email }, (error, result) => {
                if (result) {
                    req.flash('error', 'Email Already exists');
                    req.flash('name', name);
                    req.flash('email', email);
                    return res.redirect('/register');
                }
            });
            //Hash Password
            const hashedPassword = await bcrypt.hash(password, 10);
            // Create a user
            const user = new User({
                name: name,
                email: email,
                password: hashedPassword
            });
            user.save().then((user) => {
                //Login
                return res.redirect('/');
            }).catch(errror => {
                req.flash('error', 'Something went wrong');
                return res.redirect('/register');
            });
        },
        logout(req, res) {
            req.logout()
            return res.redirect('/login')
        }
    }
}


module.exports = authController