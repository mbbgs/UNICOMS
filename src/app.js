require('dotenv').config();


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

const { auditMiddleware } = require('./middlewares/audit.js');
const { attackMiddleware, wpScanDetector } = require('./middlewares/security.js');
const { sessionMiddlewareJWT } = require('./middlewares/auth.js');
const appLimiter = require('./middlewares/ratelimiter.js');
const { globalErrorHandler, notFoundHandler } = require('./middlewares/errorHandlers.js');
const { sanitizePaths, blockCommonAttacks, blockWordPressProbes } = require('./middlewares/botBlocker.js');

const authRouter = require("./routers/authRouter.js");
const courseRouter = require("./routers/courseRouter.js");
const ticketRouter = require("./routers/ticketRouter.js");
const departmentRouter = require("./routers/departmentRouter.js");
const studentRouter = require("./routers/studentRouter.js");
const examRouter = require("./routers/examtRouter.js");

const ipBanner = require('./services/ipBanner.js');

const app = express();
const mainRouter = express.Router();
const nIpbanner = new ipBanner(app);

// CORS Configuration
const corsOptions = {
  methods: ["GET", "DELETE", "POST"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 200,
  credentials: true,
};

// Basic App Configuration
app.set("trust proxy", 1);


// Essential Middleware
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(helmet.hidePoweredBy());
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.dnsPrefetchControl());

app.use(hpp());
app.use(mongoSanitize());
app.use(sanitizePaths(nIpbanner));
app.use(blockWordPressProbes(nIpbanner));
app.use(blockCommonAttacks(nIpbanner));

app.use(wpScanDetector);
app.use(attackMiddleware);
app.use(sessionMiddlewareJWT);
app.use(auditMiddleware);

// Health Check
app.get("/checkup", (req, res) =>
  res.status(200).json({
    status: 'healthy',
    message: "Service is running 🚀",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  })
);

// Main Routers
mainRouter.use('/auth', appLimiter, authRouter);
mainRouter.use('/course', appLimiter, courseRouter);
mainRouter.use('/tickets', appLimiter, ticketRouter);
mainRouter.use('/departments', appLimiter, departmentRouter);
mainRouter.use('/students', appLimiter, studentRouter);
mainRouter.use('/exams', appLimiter, examRouter);

// Mount Main Router
app.use('/api', mainRouter);

// Error Handlers
app.use(globalErrorHandler);
app.use(notFoundHandler);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = { app };