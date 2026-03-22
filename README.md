# Express Middleware Assignment

This project secures an Energy API using Express.js middleware.

## Installation

Install the required packages:

```bash
npm install
```

Start the server:

```bash
npm start
```

The server runs on `http://localhost:3000`


## Authentication

### Bearer Token for Testing

To access the protected API route `/api/oil-prices`, use the following header:

```
Authorization: Bearer energy_secret_2026
```

### Basic Auth for /dashboard

To access the protected dashboard route `/dashboard`, use these credentials:

- **Username:** `admin`
- **Password:** `123456`

---

## Endpoints

### `GET /api/oil-prices`

Protected with Bearer Token authentication. Returns the static oil price JSON object.

### `GET /dashboard`

Protected with Basic Auth. Serves a simple HTML dashboard showing the oil prices.

### `GET /logout`

Logs the user out by forcing re-authentication and displays a logged out message.
