const express = require('express')
const Task = require('../models/task')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/api/tasks', auth, async (req, res) => {
    try {
        const task = new Task({
            ...req.body,
            created_by: req.user._id
        })
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e.message)
    }
})

router.get('/api/tasks', auth, async (req, res) => {
    const match = {status: false}
    const sort = {}

    if (req.query.completed === 'true') {
        delete match.status
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1:1
    }

    try {
        await req.user.populate({
            path: 'tasks', 
            match,
            options: {
                limit: parseInt(req.query.limit) || 10,
                skip: parseInt(req.query.skip) || 0,
                sort
            }
        })
        const tasks = req.user.tasks
        res.send(tasks)
    } catch (e) {
        res.status(500).send()
    }
})

//GET /tasks?completed=true
//GET /tasks?limit=10&skip=0
//GET /tasks?sortBy=createdAt_desc

router.get('/api/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, created_by: req.user._id })
        if (!task) {
            return res.status(404).send('No task with this ID was found')
        }
        return res.send(task)
    } catch (e) {
        res.status(500).send(e.message)
    }
})

router.patch('/api/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['title', 'status']
    const isValid = updates.every((update) => allowedUpdates.includes(update))
    if (!isValid) { return res.status(403).send('You have included parameters that are not allowed.') }

    try {
        const task = await Task.findOne({ _id: req.params.id, created_by: req.user._id })
        if (!task) { return res.status(404).send('Task Not Found') }
        updates.forEach((update) => { task[update] = req.body[update] })
        await task.save()
        return res.send(task)
    } catch (e) {
        res.status(500).send(e.message)
    }
})

router.delete('/api/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, created_by: req.user._id })
        if (!task) { return res.status(404).send() }
        return res.send()
    } catch (e) { res.status(500).send() }
})

module.exports = router