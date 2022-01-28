const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const sendEmail = require('../emails/paths')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/api/users', async (req, res) => {
    try {
        const user = await new User(req.body)
        await user.save()
        const token = await user.generateAuthToken()
        sendEmail.welcomeEmail(user.email, user.name)
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e.message)
    }
})

router.post('/api/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(401).send()
    }
})

router.post('/api/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/api/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/api/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/api/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'age', 'email', 'password']
    const isValid = updates.every((update) => allowedUpdates.includes(update))
    if (!isValid) { return res.status(403).send('You have included parameters that are not allowed.') }

    try {
        updates.forEach((update) => { req.user[update] = req.body[update] })
        await req.user.save()
        return res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.delete('/api/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendEmail.goodbyeEmail(req.user.email, req.user.name)
        return res.send(`Your user account has been deleted`)
    } catch (e) { res.status(500).send(e) }
})

const avatar = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
            return cb(new Error('File Type must be JPG, PNG or JPEG!'))
        }
        cb(undefined, true)
    }
})

router.post('/api/users/me/avatar', auth, avatar.single('avatar'), async (req, res) => {
    req.user.avatar = await sharp(req.file.buffer)
        .resize({ width: 200, height: 200 })
        .png()
        .toBuffer()
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/api/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/api/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router