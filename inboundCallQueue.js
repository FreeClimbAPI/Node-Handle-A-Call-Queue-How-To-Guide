require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const freeclimbSDK = require('@freeclimb/sdk')
const { PerclScript, Enqueue, GetDigits, Say, Dequeue, Redirect } = require('@freeclimb/sdk')

const app = express()
app.use(bodyParser.json())
// Where your app is hosted ex. www.myapp.com
const host = process.env.HOST
const port = process.env.PORT || 80
// your freeclimb API key (available in the Dashboard) - be sure to set up environment variables to store these values
const accountId = process.env.ACCOUNT_ID
const apiKey = process.env.API_KEY
const configuration = freeclimbSDK.createConfiguration({ accountId, apiKey })
const freeclimb = new freeclimbSDK.DefaultApi(configuration)

app.post('/incomingCall', (req, res) => {
  freeclimb.createAQueue({ alias: 'Test', maxSize: 25 })
    .then(queue => {
      res.status(200).json(new PerclScript({
        commands: [
          new Enqueue({ queueId: queue.queueId, actionUrl: `${host}/inboundCallAction`, waitUrl: `${host}/inboundCallWait` })
        ]
      }).build())
    }).catch(err => {
      console.log(err)
    })
})

app.post('/inboundCallWait', (req, res) => {
  res.status(200).json(new PerclScript({
    commands: [
      new GetDigits({
        prompts: [
          new Say({ text: "Press any key to exit queue." })
        ],
        maxDigits: 1,
        minDigits: 1,
        flushBuffer: true,
        actionUrl: `${host}/callDequeue`
      })
    ]
  }).build())
})

app.post('/callDequeue', (req, res) => {
  if (req.body.digits && req.body.digits.length > 0) {
    res.status(200).json(new PerclScript({
      commands: [
        new Dequeue()
      ]
    }).build())
  } else {
    res.status(200).json(new PerclScript({
      commands: [
        new Redirect({ actionUrl: `${host}/inboundCallWait` })
      ]
    }).build())
  }
})

app.post('/inboundCallAction', (req, res) => {
  res.status(200).json(new PerclScript({
    commands: [
      new Say({ text: "Call exited queue" })
    ]
  }).build())
})

// Specify this route with 'Status Callback URL' in App Config
app.post('/status', (req, res) => {
  // handle status changes
  res.status(200)
})

app.listen(port, () => {
  console.log('Listening on port ' + port)
})
