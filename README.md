# Express Middleware Assignment

This project demonstrates how to secure an Energy API using Express.js middleware, including IP filtering, CORS, rate limiting, and authentication mechanisms.

---

## Features

- IP Filtering (only allows localhost)
- CORS restriction (local development origin only)
- Rate Limiting (10 requests per minute)
- JWT Bearer Token Authentication (`/api/oil-prices`)
- Basic Authentication (`/dashboard`)
- Logout functionality (`/logout`)

---

## Installation

Install dependencies:

```bash
npm install
```

Run the Server

```bash
npm start
```

Server runs at:

`http://localhost:3000`

---

## Bearer Token (JWT) for Testing

This project uses JWT for authentication.

### Step 1: Generate Token

Send a POST request to:

`http://localhost:3000/login`

With this JSON body:

```json
{
  "username": "marina",
  "password": "123456"
}
```

### Step 2: Use the Token

The server will return a JWT token. Use it like this:

```
Authorization: Bearer <your_generated_token>
```

### Example Protected Endpoint

`GET /api/oil-prices`

---

## Basic Auth for Dashboard

Access the dashboard:

`http://localhost:3000/dashboard`

Credentials:

- Username: `admin`
- Password: `123456`

---

## Logout

Visit:

`http://localhost:3000/logout`

This clears access and shows a logged-out page.
