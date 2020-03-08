const express = require('express')
const { randomBytes } = require('crypto')
const { promisify } = require('util')
const app = express()
require('dotenv').config({ path: './.env' })
const opts = {
  maxNetworkRetries: 2,
  telemetry: true
}
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, opts)

const { create } = require('./db')

const generateKey = async (n) => {
  const rB = promisify(randomBytes)
  const out = await rB(n).toString('base64').replace(/\W/g, '')
  return out
}

app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith('/webhook')) {
        req.rawBody = buf.toString()
      }
    }
  })
)

app.get('/', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/create-customer', async (req, res) => {
  const customer = await stripe.customers.create({
    payment_method: req.body.payment_method,
    email: req.body.email,
    invoice_settings: {
      default_payment_method: req.body.payment_method
    }
  }).catch((e) => res.json({ error: e.message }))

  // generate api key with appropriate access
  const key = await generateKey(96)
  await create('customers', customer.id, customer).catch((e) => console.log(e))
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ plan: req.body.planId }],
    expand: ['latest_invoice.payment_intent']
  }).catch((e) => res.json({ error: e.message }))

  res.send(subscription)
})

app.post('/get-subscription', async (req, res) => {
  const subscription = await stripe.subscriptions.retrieve(req.body.subscriptionId)
    .catch((e) => res.json({ error: e.message }))
  res.send(subscription)
})

app.post('/cancel-subscription', async (req, res) => {
  const confirmation = await stripe.subscriptions.del(req.body.subscriptionId)
    .catch((e) => res.json({ error: e.message }))
  res.send(confirmation)
})

app.post('/webhook', async (req, res) => {
  let dataObject
  let eventType

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    let event
    const signature = req.headers['stripe-signature']

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.log('Webhook signature verification failed.')
      return res.sendStatus(400)
    }

    dataObject = event.data.object
    eventType = event.type

    switch (event.type) {
      case 'customer.created':
        console.log(dataObject)
        break
      case 'customer.updated':
        console.log(dataObject)
        break
      case 'invoice.upcoming':
        console.log(dataObject)
        break
      case 'invoice.created':
        console.log(dataObject)
        break
      case 'invoice.finalized':
        console.log(dataObject)
        break
      case 'invoice.payment_succeeded':
        console.log(dataObject)
        break
      case 'invoice.payment_failed':
        console.log(dataObject)
        break
      case 'customer.subscription.created':
        console.log(dataObject)
        break
      default:
        return res.status(400).end()
    }
  } else {
    dataObject = req.body.data
    eventType = req.body.type
  }

  res.sendStatus(200)
})

app.listen(3000, () => console.log('Node server listening on port 3000!'))
