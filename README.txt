# ShopEasy - Setup Guide

## Your Project Files:
- index.html   → Website frontend
- style.css    → Styling
- app.js       → Frontend logic
- server.js    → Backend server (Node.js)
- database.json → All orders and users saved here

---

## How to Run:

### Step 1 — Install Node.js (if not installed)
Download from: https://nodejs.org  (click "LTS" version)

### Step 2 — Open this folder in VS Code
File → Open Folder → select the "shopeasy" folder

### Step 3 — Open Terminal in VS Code
Press: Ctrl + ` (backtick key)

### Step 4 — Start the server
Type this and press Enter:
  node server.js

### Step 5 — Open the website
Open your browser and go to:
  http://localhost:3000

---

## How it works:
- Users/orders are saved in database.json file
- Login → saved in database.json under "users"
- Place order → saved in database.json under "orders"
- You can open database.json anytime to see all data!

---

## To stop the server:
Press Ctrl + C in the terminal
