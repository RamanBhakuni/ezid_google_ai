# EZID - Identity Simplified

EZID is a digital identity-shortening platform that allows individuals to share a short code (e.g., `ezid.in/rahul23`) instead of long email addresses. Businesses can securely look up these IDs to retrieve verified contact details.

## 🚀 Quick Start (Local)

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 🛠 Deployment (Docker)

This project is Docker-ready. You can deploy it to any container platform (Render, DigitalOcean, AWS ECS).

1.  **Build the Image**
    ```bash
    docker build -t ezid-app .
    ```

2.  **Run the Container**
    ```bash
    docker run -p 8080:80 ezid-app
    ```
    Access at [http://localhost:8080](http://localhost:8080).

## 🔥 Firebase Setup

This app uses Firebase for Auth and Database.

1.  **Firestore Indexes**
    For the Business Dashboard charts to work, you MUST create a Composite Index in Firestore:
    *   Collection: `lookups`
    *   Fields: `businessId` (Asc), `timestamp` (Desc)

2.  **Security Rules**
    Copy the contents of `firestore.rules` to your Firebase Console > Firestore > Rules tab to ensure data security.

## 📂 Project Structure

*   `src/pages` - Application routes (Dashboard, Landing, Auth)
*   `src/services` - Firebase DB and Auth logic
*   `src/components` - Reusable UI components
*   `firestore.rules` - Database security definitions
