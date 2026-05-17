import bcryptjs from 'bcryptjs';
import { generateToken } from '../utils/token';
import { User } from '../models/User';
import { isMongoConnected } from '../config/database';
import { memoryStore } from '../services/memoryStore';
import { randomUUID } from 'crypto';

export async function register(email: string, password: string) {
  const passwordHash = await bcryptjs.hash(password, 10);

  if (isMongoConnected()) {
    // Use MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = new User({ email, passwordHash });
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return { token, user: { email: user.email } };
  } else {
    // Use in-memory store
    if (memoryStore.getUserByEmail(email)) {
      throw new Error('User already exists');
    }

    const userId = randomUUID();
    memoryStore.saveUser({
      id: userId,
      email,
      passwordHash,
      createdAt: new Date(),
    });

    const token = generateToken({ userId, email });
    return { token, user: { email } };
  }
}

export async function login(email: string, password: string) {
  if (isMongoConnected()) {
    // Use MongoDB
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

    return { token, user: { email: user.email } };
  } else {
    // Use in-memory store
    const user = memoryStore.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({ userId: user.id, email: user.email });
    return { token, user: { email: user.email } };
  }
}

export async function getMe(userId: string) {
  if (isMongoConnected()) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return { email: user.email };
  } else {
    const user = memoryStore.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return { email: user.email };
  }
}
