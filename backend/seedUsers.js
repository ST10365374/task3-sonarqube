/**
* Seed script to create non-registrable users.
* Usage: NODE_ENV=development node seedUsers.js
*/
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');


const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/international_payments';


const users = [
{
fullName: 'Alice Customer',
idNumber: '8001015009087',
accountNumber: '10000001',
password: 'Secur3P@ssw0rd',
role: 'customer'
},
{
fullName: 'Bob Receiver',
idNumber: '8202025009086',
accountNumber: '10000002',
password: 'Secur3P@ssw0rd',
role: 'customer'
},
{
fullName: 'Admin User',
idNumber: '7703035009085',
accountNumber: 'admin0001',
password: 'AdminSecur3!',
role: 'admin'
}
];


async function run() {
try {
await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
console.log('Connected to DB at', MONGO);


for (const u of users) {
const exists = await User.findOne({ accountNumber: u.accountNumber });
if (exists) {
console.log('Already exists:', u.accountNumber);
continue;
}
const newUser = new User(u);
await newUser.save();
console.log('Seeded user:', u.accountNumber);
}
} catch (err) {
console.error('Seeding error:', err);
} finally {
await mongoose.disconnect();
console.log('Disconnected from DB');
}
}


run();