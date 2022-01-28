const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task')
const { userOne, userOneId, userTwo, userTwoId, taskOne, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

test('Create task for user', async () => {
    const response = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        "title": "New Task"
    })
    .expect(201)

    // Check in DB:
    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.created_by).toEqual(userOneId)
    // Check not completed:
    expect(task.status).toBe(false)
})

test('Get User 1 Tasks', async () => {
    const response = await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .expect(200)
    expect(response.body).toHaveLength(2)
})

test('Get User 2 Tasks', async () => {
    const response = await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .expect(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].title).toBe('Third task')
})

test('Create task', async () => {
    const response = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        title: "Creating a new task"
    })
    .expect(201)

    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull
    expect(task.title).toBe('Creating a new task')
    expect(task.status).toBe(false)
    expect(task.created_by).toStrictEqual(userOneId)
})

test('Read own task', async () => {
    // Read task 1 (owned by user 1) as user 1
    const allTasks = await request(app)
    .get(`/api/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .expect(200)
})

test('Read all tasks', async () => {
    const allTasks = await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .expect(200)
    expect(allTasks.body).toHaveLength(2)
    allTasks.body.forEach(task => {
        expect(task.created_by).toBe(userOneId.toString())
    })
})

test('Do not allow reading other tasks', async () => {
    // Read task 1 (owned by user 1) as user 2
    await request(app)
    .get(`/api/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .expect(404)
})

test('Update task', async () => {
    const response = await request(app)
    .patch(`/api/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        status: true
    })
    .expect(200)

    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull
    expect(task.status).toBe(true)
    expect(task.created_by).toStrictEqual(userOneId)
})

test('Prohibit updating another\'s task', async () => {
    await request(app)
    .patch(`/api/tasks/${taskOne._id}`)
    .set('Authorization', `Beared ${userTwo.tokens[0].token}`)
    .send({status: true})
    .expect(401)

    // Check DB has not altered:
    const task = await Task.findById(taskOne._id)
    expect(task.status).toBe(false)
})

test('Delete own task', async () => {
    await request(app)
    .delete(`/api/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .expect(200)

    const task = await Task.findById(taskOne._id)
    expect(task).toBeNull
})

test('Prohibit deleting other\'s tasks', async () => {
    await request(app)
    .delete(`/api/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .expect(404)

    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull
})