const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./task')

// mongoose.connect('mongodb://127.0.0.1:27017/task-manager-api')

// Create a new schema first to use the middleware
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate(v) {
            if (!validator.isEmail(v)) {
                throw new Error('Email address is not valid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: [true, 'Please enter a password'],
        validate(v) {
            if (!validator.isStrongPassword(v, {
                minSymbols: 0
            }
            )) {
                throw new Error(`\nPassword must be at least 8 characters and include one uppercase letter and one number`)
            } else if (v.toLowerCase().includes('password')) { throw new Error('Password cannot contain the word \'password\'') }
        }
    },
    tokens: [{
        token: {
            type: String,
            require: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

// Virtual Property for Relationship
userSchema.virtual('tasks', {
    ref: 'task',
    localField: '_id',
    foreignField: 'created_by'
})

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

// Find user during login
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) {throw new Error('Unable to login')}
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {throw new Error('Unable to login')}
    return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function(next) { // cannot be an arrow function due to bindings required (this)
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Delete user tasks when user is deleted
userSchema.pre('remove', async function(next) {
    const user = this
    await Task.deleteMany({created_by: user._id})
    next()
})

const User = mongoose.model('user', userSchema)

module.exports = User