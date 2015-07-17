'use strict'

import concat from 'concat-stream'
import { createServer } from 'http'
import { request } from 'https'
import { parse as queryStringParse } from 'querystring'
import { parse as urlParse } from 'url'
import randomWord from 'random-word'
import xtend from 'xtend'

const slackToken = process.env.SLACK_TOKEN
const url = process.env.INCOMING_WEBHOOK_URL

const handleError = res => err => {
  console.error(err.stack || err)
  res.writeHead(500, { 'Content-Type': 'text/plain' })
  res.end(err.message || err)
}

export default createServer((req, res) => {
  const errorHandler = handleError(res)

  req.pipe(concat(body => {
    const parsed = queryStringParse(body.toString())
    const token = parsed.token
    const session = parsed.text.trim() ||
      `${randomWord()}-${randomWord()}-${randomWord()}`
    const channel = `#${parsed.channel_name}`

    if (token !== slackToken) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end(`Unknown token ${token}`)
    }

    const slackReq = request(
      xtend(urlParse(url), { method: 'POST' }),
      slackRes => {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end()
      }
    )

    slackReq.on('error', errorHandler)

    slackReq.write(JSON.stringify({
      channel: channel,
      text: `made you a talky! <https://talky.io/${session}>`
    }))
    slackReq.end()
  }))

  req.on('error', errorHandler)
})
