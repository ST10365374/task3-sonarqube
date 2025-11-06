const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
{
fullName: { type: String, required: true },
idNumber: { type: String, required: true },
accountNumber: { type: String, required: true, unique: true },
password: { type: String, required: true, select: false },
role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
},
{ timestamps: true }
);

// ✅ Hash password before saving (only if modified)
UserSchema.pre('save', async function (next) {
try {
if (!this.isModified('password')) return next();
const salt = await bcrypt.genSalt(12);
this.password = await bcrypt.hash(this.password, salt);
return next();
} catch (err) {
return next(err);
}
});

// ✅ Instance method to compare password
UserSchema.methods.comparePassword = function (candidatePassword) {
return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);