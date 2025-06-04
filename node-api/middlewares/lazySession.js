require('dotenv').config();
const MongoStore = require('connect-mongo');
const session = require('express-session');

const configureSecureSession = () => {
  const sessionConfig = {
    name: 'unicoms.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 60 * 60, // 1 hour 
      autoRemove: 'native',
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Dynamic secure flag
      maxAge: 1000 * 60 * 60, // 1 hour in milliseconds
      sameSite: "strict",
      httpOnly: true
    }
  };
  
  const sessionMiddleware = session(sessionConfig);
  
  
  const lazySessionMiddleware = (req, res, next) => {
    const authRoutes = ['/login', '/create-account', '/auth'];
    const isAuthRoute = authRoutes.some(route => req.path.startsWith(route));
    
    // Ensure sessionStore exists before attempting to use it
    if (!req.sessionStore) {
      return sessionMiddleware(req, res, next);
    }
    
    // If not an auth route and not logged in, skip session creation
    if (!isAuthRoute && !req.session?.user) {
      try {
        // Use a safer method to handle session destruction
        req.sessionStore.destroy(req.sessionID, (err) => {
          if (err) {
            console.error('Error destroying session:', err);
          }
          // Explicitly set session to null
          req.session = null;
        });
      } catch (error) {
        console.error('Session destruction error:', error);
      }
    }
    
    // Proceed with regular session middleware
    sessionMiddleware(req, res, next);
  };
  
  return lazySessionMiddleware;
};

module.exports = configureSecureSession();