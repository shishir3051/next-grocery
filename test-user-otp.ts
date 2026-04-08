import dbConnect from './src/lib/mongodb.ts';
import { User } from './src/models/User.ts';

async function test() {
  await dbConnect();
  const email = 'test-' + Date.now() + '@example.com';
  const otp = '123456';
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  console.log('Creating user with:', { email, otp });

  const user = await User.create({
    name: 'Test User',
    email,
    password: 'password123',
    isVerified: false,
    verificationOtp: otp,
    otpExpiry,
  });

  console.log('Created user document:', JSON.stringify(user, null, 2));

  const foundUser = await User.findOne({ email });
  console.log('Found user in DB:', JSON.stringify(foundUser, null, 2));

  if (foundUser.verificationOtp === otp) {
    console.log('SUCCESS: OTP matches!');
  } else {
    console.log('FAILURE: OTP mismatch! Expected:', otp, 'Got:', foundUser.verificationOtp);
  }

  process.exit(0);
}

test().catch(console.error);
