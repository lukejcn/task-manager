const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../src/app')
const User = require('../src/models/user')
const { baseUser, baseUserId, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

jest.mock('../config/azureEmails')

afterAll(() => mongoose.connection.close())

test('Create a new user', async () => {
    const response = await request(app).post('/api/users')
        .send({
            name: 'Pretty Penguin',
            email: 'pretty.penguin@example.com',
            age: 4,
            password: 'Pr3ttyP3ngu!n'
        })
        .expect(201)
    // Check user was created on the database
    const dbUser = await User.findById(response.body.user._id)
    expect(dbUser).not.toBeNull()

    // Check response includes expected name
    expect(response.body).toMatchObject({
        user: {
            name: 'Pretty Penguin',
            email: 'pretty.penguin@example.com',
            age: 4,
        }
    })

    // Check password is hashed
    expect(dbUser.password).not.toBe('P@55word!')
})

test('Login existing user', async () => {
    const response = await request(app).post('/api/users/login')
        .send({
            email: baseUser.email,
            password: baseUser.password
        })
        .expect(200)

    const dbUser = await User.findById(baseUserId)

    // Check new auth token added
    expect(response.body.token).toBe(dbUser.tokens[1].token)

})

test('Login with incorrect Email address', async () => {
    await request(app).post('/api/users/login')
        .send({
            email: baseUser.password + 'wrong',
            password: baseUser.password
        })
        .expect(401)
})

test('Login with incorrect Password', async () => {
    await request(app).post('/api/users/login')
        .send({
            email: baseUser.email,
            password: 'wrong'
        })
        .expect(401)
})

test('Fetch user profile', async () => {
    await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${baseUser.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Wrong Auth Token', async () => {
    await request(app).get('/api/users/me')
        .set('Authorization', `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MWYyZjc0ZjMzYjg2NzFiMGE5YmY4NjkiLCJpYXQiOjE2NDMzMTI5NzV9.13TU2iz8Zi1fqPZX7_4Wx-2xPUzYK1M8i6z27V6XbaM`)
        .send()
        .expect(401)
})

test('No Auth Token', async () => {
    await request(app)
        .get('/api/users/me')
        .send()
        .expect(401)
})

test('Delete Account', async () => {
    await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${baseUser.tokens[0].token}`)
        .send({ disableEmail: true })
        .expect(200)
    // Check deleted from DB
    const user = await User.findById(baseUserId)
    expect(user).toBeNull
})

test('Prevent delete if not authorized', async () => {
    await request(app)
        .delete('/api/users/me')
        .send()
        .expect(401)
    // Check still in DB
    const user = await User.findById(baseUserId)
    expect(user._id).toStrictEqual(baseUserId)
})

test('User avatar upload', async () => {
    await request(app)
        .post('/api/users/me/avatar')
        .set('Authorization', `Bearer ${baseUser.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

    // Check file exists on DB
    const user = await User.findById(baseUserId)
    expect(user.avatar).toEqual(expect.any(Buffer)) // Checks that the avatar is a Buffer
})

test('Updates user fields', async () => {
    await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${baseUser.tokens[0].token}`)
        .send({
            age: 6
        })
        .expect(200)
    // Check the Database:
    const user = await User.findById(baseUserId)
    expect(user.age).toStrictEqual(6)
})

test('Prohibit updating credentials', async () => {
    await request(app)
    .patch('/api/users/me')
    .set('Authorization', `Bearer ${baseUser.tokens[0].token}`)
    .send({
        credentials: {
            password: 'N3wP@55word!'
        }
    })
    .expect(403)
})