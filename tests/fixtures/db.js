const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../../src/models/user')


const baseUserId = new mongoose.Types.ObjectId()
const baseUser = {
    _id: baseUserId,
    name: 'George Giraffe',
    email: 'george.giraffe@example.com',
    age: 29,
    password: 'P@55word!',
    tokens: [{
        token: jwt.sign({ _id: baseUserId }, process.env.JWT_SECRET)
    }]
}

const setupDatabase = async () => {
    await User.deleteMany()
    await new User(baseUser).save()
}

module.exports = {
    baseUserId,
    baseUser,
    setupDatabase
}