const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const basicAuth = require("express-basic-auth");

const app = express();

// Configuration
const PORT = 3000;
const BEARER_TOKEN = "energy_secret_2026";
const BASIC_AUTH_USER = "admin";
const BASIC_AUTH_PASS = "123456";

const oilPrices = {
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

// IP filtering - localhost only
app.use((req, res, next) => {
  let ip = req.ip || req.connection.remoteAddress;

  if (ip === "::ffff:127.0.0.1") {
    ip = "127.0.0.1";
  }

  const allowedIps = ["127.0.0.1", "::1"];

  if (!allowedIps.includes(ip)) {
    return res.status(403).send("403 Forbidden: IP not allowed");
  }

  next();
});

// CORS configuration
const whitelist = ["http://localhost:3000"];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));

// Rate limiting - 10 requests per minute
const option = {
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 1 minute",
};

app.use(rateLimit(option));

// Bearer token authentication middleware
const verifyBearerToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized: Missing or invalid Bearer token.",
    });
  }

  const token = authHeader.split(" ")[1];

  if (token !== BEARER_TOKEN) {
    return res.status(401).json({
      error: "Unauthorized: Invalid token.",
    });
  }

  next();
};

// API endpoint - requires Bearer token
app.get("/api/oil-prices", verifyBearerToken, (req, res) => {
  res.json(oilPrices);
});

// Dashboard - requires Basic auth
app.get(
  "/dashboard",
  basicAuth({
    users: { [BASIC_AUTH_USER]: BASIC_AUTH_PASS },
    challenge: true,
    realm: "EnergyDashboard",
  }),
  (req, res) => {
    const rows = oilPrices.data
      .map(
        (item) => `
      <tr>
        <td>${item.symbol}</td>
        <td>${item.name}</td>
        <td>${item.price}</td>
        <td>${item.change}</td>
      </tr>
    `,
      )
      .join("");

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Energy Dashboard</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 900px;
            margin: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 10px;
            text-align: left;
          }
          th {
            background: #222;
            color: white;
          }
          a {
            display: inline-block;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${oilPrices.market}</h1>
          <p><strong>Last Updated:</strong> ${oilPrices.last_updated}</p>
          <p><strong>Currency:</strong> ${oilPrices.currency}</p>

          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <a href="/logout">Logout</a>
        </div>
      </body>
      </html>
    `);
  },
);

// Logout endpoint
app.get("/logout", (req, res) => {
  res.setHeader("WWW-Authenticate", 'Basic realm="Energy Dashboard"');
  return res.redirect("/logged-out");
});

// Logged out confirmation page
app.get("/logged-out", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Logged Out</title>
    </head>
    <body>
      <h1>Logged Out</h1>
      <p>You have been logged out.</p>
      <a href="/dashboard">Login Again</a>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
