const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()

// MAINTENANCE MODE
// app.use(({res}) => {
//     return res.status(503).send('We\'re currently doing some maintenance. Please try again soon!')
// })

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

module.exports = app