# 🏪 দোকান ম্যানেজমেন্ট সিস্টেম

MERN Stack দিয়ে তৈরি সম্পূর্ণ দোকান ম্যানেজমেন্ট সিস্টেম।

## 📋 Features

- ✅ Manager লগইন / রেজিস্ট্রেশন
- ✅ প্রতিদিন দোকানে কত টাকার **মাল ঢুকছে** তা ইনপুট করা
- ✅ প্রতিদিন কত টাকা **Sell হচ্ছে** তা ইনপুট করা
- ✅ **১২% হারে** স্বয়ংক্রিয় Income Calculation
- ✅ আজকের / মাসিক / সর্বমোট হিসাব
- ✅ গত ৬ মাসের তুলনামূলক সারাংশ
- ✅ মাস ও বছর অনুযায়ী ফিল্টার
- ✅ এন্ট্রি মুছে ফেলার সুবিধা

## 🗂️ Project Structure

```
shop-manager/
├── backend/              # Node.js + Express + MongoDB
│   ├── models/
│   │   ├── User.js       # Manager model
│   │   ├── Stock.js      # মাল ঢোকার model
│   │   └── Sales.js      # বিক্রয় model (১২% income auto-calc)
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── .env
└── frontend-src/         # React App
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── DashboardPage.js   # Main dashboard
    │   │   ├── StockPage.js       # মাল ঢোকার হিসাব
    │   │   └── SalesPage.js       # বিক্রয়ের হিসাব
    │   ├── components/
    │   │   └── Navbar.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   └── api/
    │       └── api.js
    └── package.json
```

## 🚀 চালানোর নিয়ম

### Step 1: MongoDB চালু করুন
MongoDB আপনার কম্পিউটারে install থাকতে হবে।
```
mongod
```

### Step 2: Backend চালু করুন
```bash
cd backend
npm install
npm run dev
```
Backend চলবে: http://localhost:5000

### Step 3: Frontend চালু করুন
```bash
cd frontend-src
npm install
npm start
```
Frontend চলবে: http://localhost:3000

## 📊 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register | নতুন manager রেজিস্ট্রেশন |
| POST | /api/auth/login | লগইন |
| GET | /api/auth/me | আমার তথ্য |
| POST | /api/stock | মাল ঢোকার এন্ট্রি |
| GET | /api/stock?month=&year= | মালের তালিকা |
| DELETE | /api/stock/:id | এন্ট্রি মুছুন |
| POST | /api/sales | বিক্রয় এন্ট্রি |
| GET | /api/sales?month=&year= | বিক্রয়ের তালিকা |
| DELETE | /api/sales/:id | এন্ট্রি মুছুন |
| GET | /api/dashboard?month=&year= | Dashboard সারাংশ |

## 💰 Income Calculation
```
বিক্রয় পরিমাণ × ১২% = আয়
উদাহরণ: ৳১০,০০০ × ১২% = ৳১,২০০ আয়
```

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, Bcrypt
- **Frontend**: React.js, Axios, Context API
- **Database**: MongoDB
