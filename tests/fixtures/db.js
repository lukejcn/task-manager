const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const Task = require('../../src/models/task')
const User = require('../../src/models/user')


const userOneId = new mongoose.Types.ObjectId()
const userOne = {
    _id: userOneId,
    name: 'George Giraffe',
    email: 'george.giraffe@example.com',
    age: 29,
    password: 'P@55word!',
    tokens: [{
        token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }]
}

const userTwoId = new mongoose.Types.ObjectId()
const userTwo = {
    _id: userTwoId,
    name: 'Ellie Elephant',
    email: 'ellie.elephant@example.com',
    age: 92,
    password: 'el3Ph@nt',
    tokens: [{
        token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET)
    }]
}

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    title: 'First task',
    completed: false,
    created_by: userOne._id
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Second task',
    completed: true,
    created_by: userOne._id
}

const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Third task',
    completed: false,
    created_by: userTwo._id
}

const setupDatabase = async () => {
    await User.deleteMany()
    await new User(userOne).save()
    await new User(userTwo).save()
    await Task.deleteMany()
    await new Task(taskOne).save()
    await new Task(taskTwo).save()
    await new Task(taskThree).save()
}

module.exports = {
    userOneId,
    userOne,
    userTwoId,
    userTwo,
    taskOne,
    setupDatabase
}