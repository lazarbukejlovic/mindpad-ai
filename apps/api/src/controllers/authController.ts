import bcryptjs from 'bcryptjs';
import { generateToken } from '../utils/token';
import { User } from '../models/User';
import { isMongoConnected } from '../config/database';

function serializeUser(user: InstanceType<typeof User>) {
  return {
    id: user._id.toString(),
    _id: user._id.toString(),
    email: user.email,
    name: user.name || null,
    avatarUrl: user.avatarUrl || null,
    authProvider: user.authProvider || 'email',
    plan: user.plan || 'free',
    subscriptionStatus: user.subscriptionStatus || null,
  };
}

export async function register(email: string, password: string) {
  if (!isMongoConnected()) {
    throw new Error('Service temporarily unavailable. Please try again in a moment.');
  }

  const passwordHash = await bcryptjs.hash(password, 10);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const user = new User({ email, passwordHash, authProvider: 'email' });
  await user.save();

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });

  return { token, user: serializeUser(user) };
}

export async function login(email: string, password: string) {
  if (!isMongoConnected()) {
    throw new Error('Service temporarily unavailable. Please try again in a moment.');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
  });

  return { token, user: serializeUser(user) };
}

export async function getMe(userId: string) {
  if (!isMongoConnected()) {
    throw new Error('Service temporarily unavailable.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  return serializeUser(user);
}
