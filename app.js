require('dotenv').config()
const express = require("express")
const path = require("path")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const bodyParser = require("body-parser")



const morgan = require("morgan")
const hpp = require("hpp")
const mongoSanitize = require("express-mongo-sanitize")

const { webhookHandler, verifyWebHookSignature } = require('./controllers/ServiceControllers.js')
const { auditMiddleware } = require('./middlewares/audit.js')
const { attackMiddleware, wpScanDetector } = require('./middlewares/security.js')
const { sessionMiddleware, trackLastPage } = require('./middlewares/session.js')

const appLimiter  = require('./middlewares/ratelimiter.js')
const { globalErrorHandler, notFoundHandler } = require('./middlewares/errorHandlers.js')
const { sanitizePaths, blockCommonAttacks, blockWordPressProbes } = require('../src/middlewares/botBlocker.js')



const DevRouter = require("../src/routers/DevRouter.js")
const AuthRouter = require("../src/routers/AuthRouter.js")
const { bxRouter: BxRouter } = require("../src/routers/BusinessRouter.js")
const ServiceRouter = require("../src/routers/ServiceRouter.js")
const ViewRouter = require("../src/routers/ViewRouter.js")



const crypto = require('crypto')

const flash = require('connect-flash')
const RedisBan = require('./services/Redis.js')

const app = express()
const MainRouter = express.Router()

const ipBanner = new RedisBan(app);

app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});



// CORS Configuration
const corsOptions = {
  methods: ["GET", "DELETE", "PUT", "POST"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200,
  credentials: true,
}

// Basic App Configuration
app.set("trust proxy", 1)
app.engine('html', ejs.renderFile)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.disable("x-powered-by")

// Static Files and Security Middleware
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'public', 'assets')))
app.use(express.static(path.join(__dirname, 'public', 'utils')))
app.use(express.static(path.join(__dirname, 'public', 'auth')))
app.use(express.static(path.join(__dirname, 'public', 'service')))
app.use(express.static(path.join(__dirname, 'public', 'client')))

app.use((req, res, next) => {
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        `'nonce-${res.locals.nonce}'`,
        "https://unpkg.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net"
      ],
      styleSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "'unsafe-inline'",
      ],
      styleSrcElem: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "'unsafe-inline'",
      ],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: [
        "'self'",
        "data:",
        "https://cdn.jsdelivr.net"
      ],
      connectSrc: ["'self'"],
    },
  })(req, res, next);
});

// Essential Middleware
app.use(cors(corsOptions))
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'))
app.use(cookie())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


app.use(flash())
// Security Middleware

app.use(hpp())
app.use(mongoSanitize())
app.use(sanitizePaths(ipBanner))
app.use(blockWordPressProbes(ipBanner))
app.use(trackLastPage)
app.use(blockCommonAttacks(ipBanner))

/*
Session Configuration
const sessionConfig = {
	name: 'mitapp.sid',
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	rolling: true, // Reset session expiration on every request
	store: MongoStore.create({
		mongoUrl: process.env.MONGODB_URI,
		ttl: 60 * 60, // 1 hour in seconds
		autoRemove: 'native', // Use MongoDB's native TTL index
	}),
	cookie: {
		secure: process.env.NODE_ENV === "production", // Set to true in production
		maxAge: 1000 * 60 * 60, // 1 hour in milliseconds
		sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
		httpOnly: true
	}
};
app.use(session(sessionConfig));*/

app.use(sessionConfig)
// Custom Middleware

app.use(wpScanDetector)
app.use(attackMiddleware)
app.use(sessionMiddleware)
app.use(auditMiddleware)

// Basic Routes
app.get("/robots.txt", (req, res) => res.sendFile(path.join(__dirname, "../robots.txt")))
app.get("/sitemap.xml", (req, res) => res.sendFile(path.join(__dirname, "../sitemap.xml")))
app.get("/google024468246e9be37f.html", (req, res) => res.sendFile(path.join(__dirname, "../google024468246e9be37f.html")))

app.get("/ndu", (req, res) => res.status(200).json({
  status: 'healthy',
  message: "Service is running 🚀",
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  memoryUsage: process.memoryUsage()
}))

app.get('/.vscode/sftp.json', (req, res) => {
  // Log for potential tracking
  console.log(JSON.stringify({
    ip: req.ip,
    time: new Date().toISOString(),
    agent: req.get('User-Agent')
  }));
  
  res.set({
    'Content-Type': 'text/plain',
    'X-Compromised': 'True'
  });
  
  // Dark, minimal response
  res.send(`# We're watching you
TRACKER_ID=${req.ip.split('.').reverse().join('_')}
CAPTURE_TIMESTAMP=${Date.now()}
ORIGIN_FINGERPRINT=${require('crypto').createHash('md5').update(req.ip + req.get('User-Agent')).digest('hex')}
`)
});


// Webhook and Cron Routes
app.post('/8531c7fd5', bodyParser.raw({ type: 'application/json' }), verifyWebHookSignature, webhookHandler) // 01/03/2025

app.post('/cron-job', cronHandler)
app.post('/update-service-status', updateServiceNewStatus)

// Main Router Setup

MainRouter.use('/auth', appLimiter, AuthRouter)
MainRouter.use('/bxz', appLimiter, BxRouter)
MainRouter.use('/sxv', appLimiter, ServiceRouter)
MainRouter.use('/dev', appLimiter, DevRouter)
MainRouter.use('/', appLimiter, ViewRouter)



// Mount Main Router
app.use('/', MainRouter);


// Error Handlers
app.use(globalErrorHandler)
app.use(notFoundHandler)

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: err.message })
})

app.use((err, req, res, next) => {
  if (err.code === 'EBADSESSION') {
    req.session.destroy(() => {
      res.clearCookie('mitapp.sid')
      return sendJson(res, 401, false, 'Invalid session. Please log in again.')
    })
  } else {
    next(err)
  }
})

module.exports = { ipBanner, app }