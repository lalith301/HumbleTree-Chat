# HumbleTree Chat

A full-stack real-time chat application — a WhatsApp Web clone built with React, Node.js, MongoDB, and Socket.IO.

🌐 **Live Demo:** https://humble-tree-chat.vercel.app

---

## Features

- Real-time messaging with Socket.IO
- Multiple authentication methods — Email OTP, Google OAuth
- Image sharing via Cloudinary
- Online presence indicators
- Unseen message badges
- WhatsApp-style two-panel UI
- Fully responsive

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- Axios
- Socket.IO Client
- Firebase (Google OAuth)
- React Router v7
- React Hot Toast

**Backend**
- Node.js + Express v5
- MongoDB + Mongoose
- Socket.IO
- JWT Authentication
- Cloudinary (image uploads)
- Resend (OTP emails)
- Firebase Admin SDK

---

## Project Structure

```
HumbleTree Chat/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Sidebar, ChatContainer, RightSidebar
│   │   ├── pages/           # LoginPage, HomePage, ProfilePage
│   │   ├── assets/          # Icons and images
│   │   └── lib/             # Firebase config, utils
│   └── context/             # AuthContext, ChatContext
└── server/                  # Node.js backend
    ├── controllers/         # authController, userController, messageController, otpController
    ├── models/              # User, Message schemas
    ├── routes/              # userRoutes, messageRoutes
    ├── middleware/          # auth (JWT protection)
    └── lib/                 # db, cloudinary, mailer, otpStore, firebaseAdmin, utils
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Client — React + Vite                  │
│   LoginPage · Sidebar · ChatContainer · AuthContext │
│        Axios (REST) · Socket.IO · Firebase SDK      │
└──────────┬──────────────────────┬───────────────────┘
           │ REST /api            │ Socket.IO
           ▼                      ▼
┌─────────────────────────────────────────────────────┐
│    Server — Node.js + Express (Render)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │authMiddleware│  │otpController │  │msgCtrl   │  │
│  │ JWT verify   │  │send · verify │  │send·fetch│  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │Socket.IO srv │  │ User model   │  │ Message  │  │
│  │online · emit │  │  Mongoose    │  │  model   │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
└──────┬───────────────┬──────────┬──────────┬────────┘
       │               │          │          │
       ▼               ▼          ▼          ▼
  MongoDB Atlas     Resend    Cloudinary  Firebase
  Users·Messages  OTP email  Images·pics  Google OAuth
                humbletree.xyz            Admin SDK
```

### Data flow

1. User logs in via OTP or Google OAuth → server issues JWT
2. Client connects Socket.IO with `userId` query param → server maps userId to socketId
3. Sending a message → `POST /api/messages/send/:id` → saved to MongoDB → emitted via Socket.IO to receiver if online
4. Images uploaded as base64 → Cloudinary → URL stored in MongoDB
5. Online presence tracked in `userSocketMap` in-memory on server

---

## Running Locally

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Resend account + verified domain
- Firebase project (for Google OAuth)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/humbletree-chat.git
cd humbletree-chat
```

### 2. Setup the Server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5001
JWT_SECRET=your_jwt_secret_key

MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/humbletree

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RESEND_API_KEY=your_resend_api_key

CLIENT_URL=http://localhost:5173
```

Also place your Firebase Admin SDK JSON file at:
```
server/lib/firebaseAdmin.json
```
(Download from Firebase Console → Project Settings → Service Accounts → Generate new private key)

Start the server:
```bash
npm run server     # development (nodemon)
# or
npm start          # production
```

Server runs on `http://localhost:5001`

---

### 3. Setup the Client

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_BACKEND_URL=http://localhost:5001
```

Start the client:
```bash
npm run dev
```

Client runs on `http://localhost:5173`

---

## Environment Variables Reference

### Server

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5001) |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `MONGODB_URI` | MongoDB connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend API key for OTP emails |
| `CLIENT_URL` | Frontend URL for CORS (e.g. http://localhost:5173) |

### Client

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | Backend server URL (e.g. http://localhost:5001) |

---

## External Service Setup

### MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user and whitelist your IP
3. Copy the connection string into `MONGODB_URI`

### Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Copy Cloud Name, API Key, and API Secret from the dashboard

### Resend (Email OTP)
1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain under Domains
3. Copy the API key into `RESEND_API_KEY`
4. Update the `from` address in `server/lib/mailer.js` to use your verified domain

### Firebase (Google OAuth)
1. Create a project at [firebase.google.com](https://firebase.google.com)
2. Enable Google as a sign-in provider under Authentication
3. Add your domain to Authorized Domains
4. Download the Admin SDK JSON (Service Accounts tab) → place at `server/lib/firebaseAdmin.json`
5. The client Firebase config is already set in `client/src/lib/firebase.js`

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Email/password signup |
| POST | `/login` | Email/password login |
| GET | `/check` | Verify JWT token |
| PUT | `/update-profile` | Update profile (protected) |
| POST | `/firebase` | Google OAuth login |
| POST | `/send-otp` | Send OTP to email |
| POST | `/verify-otp` | Verify OTP and login/signup |

### Messages (`/api/messages`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | Get all users for sidebar |
| GET | `/:id` | Get messages with a user |
| POST | `/send/:id` | Send a message |
| PUT | `/mark/:id` | Mark message as seen |

---

## Deployment

The app is deployed on separate platforms for client and server.

- **Client:** Vercel static deployment with SPA rewrite rules — https://humble-tree-chat.vercel.app
- **Server:** Render web service — https://humbletree-chat.onrender.com

For the client, set environment variables in Vercel project settings → Settings → Environment Variables.
For the server, set environment variables in your Render service → Environment tab.