# Deploying DevSpace on Render

This guide outlines how to deploy the DevSpace full-stack application (Next.js frontend + Node.js backend) to **Render** using the provided settings.

---

## Deployment Options

### Option A: Using the Render Blueprint (`render.yaml`) (Recommended)

Render Blueprints allow you to orchestrate and deploy both services at once with variables auto-wired.

1. Commit and push your code to a GitHub or GitLab repository.
2. Log in to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New** in the top-right corner and select **Blueprint**.
4. Connect your repository containing the `render.yaml` file.
5. Review the blueprint setup:
   * **devspace-backend**: The Node.js server service.
   * **devspace-frontend**: The Next.js client service.
6. Under variables, specify your **`MONGO_URI`** connection string (e.g. from MongoDB Atlas). The `JWT_SECRET` will be automatically generated.
7. Click **Apply**. Render will initialize, build, and deploy both services, linking the frontend to the backend URL automatically.

---

### Option B: Manual Service Configuration

If you prefer to configure each service manually in the Render UI:

#### 1. Deploy the Backend Web Service
1. Click **New** -> **Web Service**.
2. Connect your repository.
3. Configure the following settings:
   * **Name:** `devspace-backend`
   * **Root Directory:** `server`
   * **Language:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
4. Go to the **Environment** tab and add:
   * `PORT`: `5001`
   * `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/devspace`
   * `JWT_SECRET`: *(A long secure string)*
5. Click **Create Web Service** and copy the deployed URL (e.g. `https://devspace-backend.onrender.com`).

#### 2. Deploy the Frontend Web Service
1. Click **New** -> **Web Service** (Next.js has dynamic pages like `/room/[roomId]` which require a Node.js runtime, so it must be deployed as a Web Service, not a Static Site).
2. Connect your repository.
3. Configure the following settings:
   * **Name:** `devspace-frontend`
   * **Root Directory:** `.` (leave empty or default)
   * **Language:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
4. Go to the **Environment** tab and add:
   * `NEXT_PUBLIC_BACKEND_URL`: *(Paste the backend URL copied from the backend deployment, e.g. `https://devspace-backend.onrender.com`)*
5. Click **Create Web Service**.

---

## Persistent Storage Info
*   **Database:** MongoDB Atlas is recommended for persistence since local disk storage in Render services is ephemeral (wiped on restart). Simply supply your MongoDB Atlas URI in `MONGO_URI`.
*   **Memory Fallback:** If `MONGO_URI` is left blank, DevSpace will run on Render using in-memory mock collections, but states will reset whenever the backend container restarts.
