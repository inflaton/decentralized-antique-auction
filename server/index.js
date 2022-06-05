const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const serveStatic = require('serve-static')
const path = require('path')
const cmd = require('node-cmd')

require('dotenv').config()
const nodeEnv = process.env.NODE_ENV || 'development'
console.log(`nodeEnv: ${nodeEnv}`)

var forceSSL = function (req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''))
  }
  return next()
}

const app = express()

if (nodeEnv !== 'development') {
  app.use(forceSSL)
}

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const GIT_SH_PATH = __dirname + '/git.sh'

const handleGitEvent = (req, res) => {
  console.log(`handling event: ${req.headers['x-github-event']}`)
  if (req.headers['x-github-event'] === 'push') {
    cmd.runSync(`bash ${GIT_SH_PATH}`, (err, data) => {
      if (err) return console.log(err)
      console.log(data)
      return res.status(200).send(data)
    })
  } else if (req.headers['x-github-event'] === 'ping') {
    return res.status(200).send('PONG')
  } else {
    return res.status(200).send('Unsupported Github event. Nothing done.')
  }
}

app.post('/api/git', handleGitEvent)

app.get('/api/git', (_req, res) => {
  res.json({ GIT_SH_PATH })
})

// mintRoute(app);
// bind the request to an absolute path or relative to the CWD
const staticPath = __dirname + '/../dist'
// console.log(`serving files from: ${staticPath}`)
app.use(express.static(staticPath))

const port = process.env.PORT || 8080
app.listen(port)
console.log(`app is listening on port: ${port}`)
console.log(`> Local: http://localhost:${port}/`)
