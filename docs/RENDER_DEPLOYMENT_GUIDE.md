# QueueLess - Render Cloud Deployment Guide

This guide covers deploying the entire **QueueLess Virtual Queue Management System** on [Render](https://render.com) (free tier supported).

The architecture consists of **3 independent services**:
1. **Frontend**: `queueless-client` (Static Site / SPA - React, Vite, Tailwind CSS)
2. **Microservice 1 (Core)**: `queueless-server` (Web Service - Node.js Express, Socket.IO, Auth & Queue logic)
3. **Microservice 2 (Alerts)**: `queueless-notifications` (Web Service - Node.js Express, Inter-Service REST API)

---

## Prerequisites: MongoDB Atlas Database (Free M0 Cluster)

Render requires a cloud database for persistent storage.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. Click **Create a Deployment** -> select **M0 (Free)**.
3. In **Security Quickstart**:
   - Create a database user (e.g., username: `queueless_admin`, password: `YourStrongPassword123`).
   - In **Network Access / IP Access List**, choose **Allow Access from Anywhere** (`0.0.0.0/0`) so Render services can connect.
4. Click **Connect** -> **Drivers** -> Copy the connection string:
   ```text
   mongodb+srv://queueless_admin:YourStrongPassword123@cluster0.mongodb.net/queueless?retryWrites=true&w=majority
   ```
*(Replace `queueless_admin` and `YourStrongPassword123` with your actual Atlas credentials).*

---

## Method 1: Automated Blueprint Deployment (Recommended)

This repository includes a [`render.yaml`](../render.yaml) blueprint file that configures all 3 services and their inter-service wiring automatically.

1. Push your code to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click the **New +** button in the top navigation bar and select **Blueprint**.
4. Connect your GitHub account and select **`queueless-virtual-queue-system`**.
5. Render will detect the `render.yaml` file and display the 3 services:
   - `queueless-server` (Web Service)
   - `queueless-notifications` (Web Service)
   - `queueless-client` (Static Site)
6. Fill in the missing environment variables prompted by Render:
   - **`MONGODB_URI`** (for both `queueless-server` and `queueless-notifications`): Paste your MongoDB Atlas URI.
   - **`CLIENT_URL`**: You can enter `*` or your frontend URL (e.g., `https://queueless-client.onrender.com`).
7. Click **Apply**. Render will automatically provision, build, and deploy all 3 services!

---

## Method 2: Manual Service Creation on Render

If you prefer to configure each service manually in the Render dashboard:

### Step 1: Deploy Microservice 2 (`queueless-notifications`)
1. Click **New +** -> **Web Service**.
2. Connect your repository: `queueless-virtual-queue-system`.
3. Configure settings:
   - **Name**: `queueless-notifications`
   - **Region**: Singapore or Oregon (pick the same region for all services)
   - **Branch**: `main`
   - **Root Directory**: `notification-service`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Add **Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `5001` |
   | `TZ` | `Asia/Kolkata` |
   | `MONGODB_URI` | `your_mongodb_atlas_connection_string` |
   | `JWT_SECRET` | `queueless_jwt_secret_production_key_2026` |
   | `QUEUE_SERVICE_URL` | `https://queueless-server.onrender.com` (can be updated after Step 2) |
   | `CLIENT_URL` | `*` |
5. Click **Create Web Service**. Note the deployed URL (e.g. `https://queueless-notifications.onrender.com`).

---

### Step 2: Deploy Microservice 1 (`queueless-server`)
1. Click **New +** -> **Web Service**.
2. Connect your repository: `queueless-virtual-queue-system`.
3. Configure settings:
   - **Name**: `queueless-server`
   - **Region**: Same as Step 1
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Add **Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `TZ` | `Asia/Kolkata` |
   | `MONGODB_URI` | `your_mongodb_atlas_connection_string` |
   | `JWT_SECRET` | `queueless_jwt_secret_production_key_2026` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `NOTIFICATION_SERVICE_URL` | `https://queueless-notifications.onrender.com` (from Step 1) |
   | `CLIENT_URL` | `*` |
5. Click **Create Web Service**. Note the deployed URL (e.g. `https://queueless-server.onrender.com`).

*(Note: On first startup, the server automatically checks if the database is newly created and seeds demo accounts and counters into your MongoDB Atlas cluster!)*

---

### Step 3: Deploy Frontend SPA (`queueless-client`)
1. Click **New +** -> **Static Site**.
2. Connect your repository: `queueless-virtual-queue-system`.
3. Configure settings:
   - **Name**: `queueless-client`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. In **Redirects / Rewrites**:
   - Add a Rewrite rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`
   *(This is crucial for React Router client-side routing).*
5. Add **Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://queueless-server.onrender.com` (from Step 2) |
6. Click **Create Static Site**. Render will build and publish your frontend to a global CDN!

---

## Verification & Inter-Service Health Check

Once all 3 services are deployed, verify them using your browser or Postman:

1. **Queue API Health**:
   ```http
   GET https://queueless-server.onrender.com/api/health
   ```
   **Expected Response (200 OK)**:
   ```json
   {
     "status": "healthy",
     "system": "QueueLess API Server",
     "version": "1.0.0",
     "timestamp": "2026-10-15T00:10:00.000Z"
   }
   ```

2. **Inter-Service Communication Verification**:
   ```http
   GET https://queueless-notifications.onrender.com/api/notifications/health
   ```
   **Expected Response (200 OK)**:
   ```json
   {
     "service": "Notification Microservice",
     "status": "healthy",
     "interServiceConnection": {
       "queueService": "connected"
     }
   }
   ```
   *(This proves the two microservices are communicating via REST API on the cloud platform).*

3. **Frontend Application**:
   - Visit `https://queueless-client.onrender.com` in your browser.
   - All token displays, status clocks, and audit logs will automatically render in Indian Standard Time (IST).

---

## Pre-Configured Demo Accounts

The system automatically initializes demo data into fresh MongoDB Atlas databases on first boot:

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@queueless.com` | `Admin@123` |
| **Counter Staff** | `priya.teller@queueless.com` | `Staff@123` |
| **Customer** | `rahul.customer@queueless.com` | `Customer@123` |
