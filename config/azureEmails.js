const axios = require('axios')

const getToken = async () => {
    try {
        const url = `https://login.microsoftonline.com/${process.env.AZURE_TENANT}/oauth2/v2.0/token`
        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.AZURE_CLIENT,
            scope: 'https://graph.microsoft.com/.default',
            client_secret: process.env.AZURE_SECRET,
        })
        const token = await axios.post(url, params)
        return token.data.access_token
    } catch (e) {
        console.log(e.message)
    }
}

const sendEmail = async (address, subject, content) => {
    const token = await getToken()
    const url = `https://graph.microsoft.com/v1.0/users/${process.env.AZURE_EMAIL}/sendMail` // TODO: Remove email address (.env)
    await axios.post(url, {
        message: {
            subject,
            body: {
                contentType: "text",
                content
            },
            toRecipients: [{ "emailAddress": { address } }]
        }
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}

module.exports = sendEmail