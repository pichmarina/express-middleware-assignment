const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;

const JWT_SECRET = "my_super_secret_jwt_key";
const DEV_ORIGIN = "http://localhost:3000";

// Basic Auth credentials
const BASIC_AUTH_USER = "admin";
const BASIC_AUTH_PASS = "123456";

// Login credentials to generate JWT
const LOGIN_USER = "marina";
const LOGIN_PASS = "123456";

app.use(express.json());

// Static Oil Price Data
const oilPriceData = {
  market: "Global Energy Exchange",
  last_updated: "2026-03-15T12:55:00Z",
  currency: "USD",
  data: [
    {
      symbol: "WTI",
      name: "West Texas Intermediate",
      price: 78.45,
      change: 0.12,
    },
    {
      symbol: "BRENT",
      name: "Brent Crude",
      price: 82.3,
      change: -0.05,
    },
    {
      symbol: "NAT_GAS",
      name: "Natural Gas",
      price: 2.15,
      change: 0.02,
    },
  ],
};

// IP Filtering Middleware
function ipFilter(req, res, next) {
  const allowedIPs = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];
  const clientIP = req.ip || req.connection.remoteAddress;

  if (allowedIPs.includes(clientIP)) {
    return next();
  }

  return res.status(403).json({
    error: "Forbidden: Access allowed only from localhost",
  });
}

// CORS Middleware
const corsOptions = {
  origin: DEV_ORIGIN,
  credentials: true,
};

// Rate Limiter Middleware
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many requests. Please try again after 1 minute.",
  },
});

// Bearer Token Authentication
function verifyBearerToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized: Bearer token required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      error: "Forbidden: Invalid or expired token",
    });
  }
}

// Basic Auth Middleware
function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Dashboard Access"');
    return res.status(401).send("Authentication required");
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf8");
  const [username, password] = credentials.split(":");

  if (username === BASIC_AUTH_USER && password === BASIC_AUTH_PASS) {
    return next();
  }

  res.setHeader("WWW-Authenticate", 'Basic realm="Dashboard Access"');
  return res.status(401).send("Invalid username or password");
}

app.use(ipFilter);
app.use(cors(corsOptions));
app.use(limiter);

// Routes
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === LOGIN_USER && password === LOGIN_PASS) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

    return res.json({
      message: "Login successful",
      token,
    });
  }

  return res.status(401).json({
    error: "Invalid username or password",
  });
});

app.get("/api/oil-prices", verifyBearerToken, (req, res) => {
  res.json(oilPriceData);
});

app.get("/dashboard", basicAuth, (req, res) => {
  const cards = oilPriceData.data
    .map((item) => {
      const isPositive = item.change >= 0;
      const changeClass = isPositive ? "up" : "down";
      const arrow = isPositive ? "▲" : "▼";

      return `
        <div class="card">
          <div class="card-top">
            <div>
              <p class="symbol">${item.symbol}</p>
              <h2>${item.name}</h2>
            </div>
            <div class="badge ${changeClass}">
              ${arrow} ${Math.abs(item.change)}
            </div>
          </div>

          <div class="price-section">
            <p class="label">Current Price</p>
            <h1>$${item.price}</h1>
          </div>
        </div>
      `;
    })
    .join("");

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Energy Dashboard</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #0f172a, #1e293b, #334155);
          min-height: 100vh;
          color: #fff;
          padding: 40px 20px;
        }

        .container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 30px;
        }

        .header-left h1 {
          font-size: 2.2rem;
          margin-bottom: 8px;
        }

        .header-left p {
          color: #cbd5e1;
          font-size: 0.95rem;
        }

        .logout-btn {
          text-decoration: none;
          background: #ef4444;
          color: white;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: bold;
          transition: 0.3s ease;
        }

        .logout-btn:hover {
          background: #dc2626;
        }

        .info-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }

        .info-box {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .info-box .label {
          color: #cbd5e1;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .info-box .value {
          font-size: 1.1rem;
          font-weight: bold;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .card {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 35px rgba(0, 0, 0, 0.35);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 25px;
          gap: 10px;
        }

        .symbol {
          color: #94a3b8;
          font-size: 0.8rem;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }

        .card h2 {
          font-size: 1.2rem;
          line-height: 1.4;
        }

        .badge {
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: bold;
          min-width: 75px;
          text-align: center;
        }

        .badge.up {
          background: rgba(34, 197, 94, 0.18);
          color: #4ade80;
        }

        .badge.down {
          background: rgba(239, 68, 68, 0.18);
          color: #f87171;
        }

        .price-section .label {
          color: #cbd5e1;
          font-size: 0.9rem;
          margin-bottom: 8px;
        }

        .price-section h1 {
          font-size: 2.1rem;
          color: #f8fafc;
        }

        .footer-note {
          margin-top: 30px;
          text-align: center;
          color: #cbd5e1;
          font-size: 0.9rem;
        }

        @media (max-width: 600px) {
          .header-left h1 {
            font-size: 1.7rem;
          }

          .price-section h1 {
            font-size: 1.8rem;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <h1>Global Energy Exchange</h1>
            <p>Live commodity snapshot for oil and gas market prices</p>
          </div>
          <a href="/logout" class="logout-btn">Logout</a>
        </div>

        <div class="info-bar">
          <div class="info-box">
            <div class="label">Market</div>
            <div class="value">${oilPriceData.market}</div>
          </div>
          <div class="info-box">
            <div class="label">Last Updated</div>
            <div class="value">${oilPriceData.last_updated}</div>
          </div>
          <div class="info-box">
            <div class="label">Currency</div>
            <div class="value">${oilPriceData.currency}</div>
          </div>
        </div>

        <div class="cards">
          ${cards}
        </div>

        <p class="footer-note">Protected dashboard using Basic Authentication</p>
      </div>
    </body>
    </html>
  `);
});

app.get("/logout", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(401).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Logged Out</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: Arial, sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a, #1e293b, #334155);
          padding: 20px;
          color: #ffffff;
        }

        .logout-card {
          width: 100%;
          max-width: 430px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 22px;
          padding: 36px 30px;
          text-align: center;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.35);
        }

        .icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          background: rgba(239, 68, 68, 0.18);
          color: #f87171;
        }

        h2 {
          font-size: 2rem;
          margin-bottom: 10px;
        }

        p {
          color: #cbd5e1;
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 26px;
        }

        .login-btn {
          display: inline-block;
          text-decoration: none;
          background: #3b82f6;
          color: white;
          padding: 12px 22px;
          border-radius: 12px;
          font-weight: bold;
          transition: 0.25s ease;
        }

        .login-btn:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }

        .note {
          margin-top: 18px;
          font-size: 0.85rem;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="logout-card">
        <div class="icon">⎋</div>
        <h2>Logged Out</h2>
        <p>You have been logged out.</p>
        <a href="/dashboard" class="login-btn">Login Again</a>
        <div class="note">Protected Energy Dashboard</div>
      </div>
    </body>
    </html>
  `);
});
app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});