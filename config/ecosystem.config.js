require('dotenv').config({ path: './config/.env' })

module.exports = {
  apps: [{
    name: "taskmanager",
    script: "./src/index.js",
    watch: true,
    env: {
      "PORT": process.env.PORT,
      "MONGODB_URL": process.env.MONGODB_URL,
      "SENDGRID_API_KEY": process.env.SENDGRID_API_KEY,
      "JWT_SECRET": process.env.JWT_SECRET
    }
  }]
}
