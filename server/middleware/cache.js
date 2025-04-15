const redis = require('redis')
const { promisify } = require('util')

let client
let getAsync
let setAsync

if (process.env.REDIS_URL) {
  client = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: true,
      rejectUnauthorized: false
    }
  })
} else {
  client = redis.createClient()
}

client.on('error', (err) => {
  console.log('Redis Client Error', err)
})

getAsync = promisify(client.get).bind(client)
setAsync = promisify(client.set).bind(client)

exports.cache = (key, ttl = 3600) => {
  return async (req, res, next) => {
    if (process.env.NODE_ENV === 'development') return next()
    
    const cacheKey = key || req.originalUrl
    try {
      const cachedData = await getAsync(cacheKey)
      if (cachedData) {
        return res.json(JSON.parse(cachedData))
      }
      res.originalSend = res.json
      res.json = async (body) => {
        await setAsync(cacheKey, JSON.stringify(body), 'EX', ttl)
        res.originalSend(body)
      }
      next()
    } catch (err) {
      console.error('Redis error:', err)
      next()
    }
  }
}