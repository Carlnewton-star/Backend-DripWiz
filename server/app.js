const express = require('express')
const path = require('path')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const dotenv = require('dotenv')
const morgan = require('morgan')
const fileUpload = require('express-fileupload')
const mongoose = require('mongoose')
const sanitize = require('./middleware/sanitize')

// Load env vars
dotenv.config({ path: './config/config.env' })

// Route files
const products = require('./routes/products')
const auth = require('./routes/auth')
const users = require('./routes/users')
const orders = require('./routes/orders')
const reviews = require('./routes/reviews')

const app = express()

// Body parser
app.use(express.json())

// Cookie parser
app.use(cookieParser())

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Strip NoSQL-injection-style keys and obvious script tags. Replaces
// express-mongo-sanitize + xss-clean, both of which reassign req.query
// outright and crash under Express 5 (req.query is getter-only there) —
// see middleware/sanitize.js for the full explanation.
app.use(sanitize)

// Set security headers
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100
})
app.use(limiter)

// Prevent http param pollution
app.use(hpp())

// Only the deployed frontend origin plus the local Vite dev server may call
// this API cross-origin — matches the CORS pattern used across the rest of
// the portfolio (Bree, GnG, Velocity). Credentials are enabled because auth
// uses an httpOnly cookie in addition to the Bearer token.
const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean)
)
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin))
    },
    credentials: true
  })
)

// Parses multipart/form-data file uploads into req.files — required by
// controllers/products.js's uploadProductPhoto, which was previously wired
// to an API shape (req.files.file, .tempFilePath) with no middleware
// actually providing it.
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }))

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

// Actually touches the DB (a trivial ping) rather than returning a static
// 200 — a scheduled ping to this route keeps both the Render web service
// and the shared Atlas cluster from going idle. See docs/status.md.
app.get('/api/v1/health', async (_req, res) => {
  try {
    await mongoose.connection.db.admin().ping()
    res.json({ ok: true })
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message })
  }
})

// Mount routers
app.use('/api/v1/products', products)
app.use('/api/v1/auth', auth)
app.use('/api/v1/users', users)
app.use('/api/v1/orders', orders)
app.use('/api/v1/reviews', reviews)

// 404 for anything else under /api
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// Error handling middleware — previously always returned a bare 500,
// discarding every ErrorResponse's actual statusCode/message (so a
// controller's carefully-thrown 400/401/403/404 always reached the client
// as an opaque 500).
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  })
})

module.exports = app
