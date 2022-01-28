const Azure = require('../../config/azureEmails')

const welcomeEmail = (email, name) => {
    const subject = `Welcome to the Task Manager, ${name.split(' ')[0]}!`
    const content = `Hi ${name.split(' ')[0]}, welcome! I hope you enjoy creating tasks`
    Azure(email, subject, content)
}

const goodbyeEmail = (email, name) => {
    const subject = `Sorry you're leaving, ${name.split(' ')[0]}`
    const content = `Dear ${name.split(' ')[0]}, I'm sorry that you're leaving. Is there anything we could have done better?`
    Azure(email, subject, content)
}

module.exports = {
    welcomeEmail,
    goodbyeEmail
}