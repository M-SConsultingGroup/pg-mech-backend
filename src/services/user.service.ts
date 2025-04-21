// src/services/user.service.ts
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import UserModel from '@/models/schema/user';
import { User } from '@/common/interfaces';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginResponse } from '@/models/dto/user.dto';

@Injectable()
export class UserService {
  async login(username: string, password: string): Promise<LoginResponse> {
    const user = await UserModel.findOne({ username }).exec();
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.NO_CONTENT);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Generate access token
    const token = this.generateAccessToken(user);

    // Save refresh token to user document
    await UserModel.findByIdAndUpdate(user.id, { token });

    return {
      status: 200,
      message: 'Login successful',
      token,
      user: {
        id: user.id || user._id,
        username: user.username,
        isAdmin: user.isAdmin,
      }
    };
  }

  private generateAccessToken(user: User): string {
    return jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Short expiration for security
    );
  }

  async validateToken(token: string): Promise<any> {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded === 'string' || decoded?.exp < Date.now() / 1000) {
      return { valid: false, decoded };
    }
    const user = await UserModel.findById(decoded.id);

    return { ...decoded, user: user ? user.toObject() : null, valid: true };
  }

  async refreshAccessToken(token: string): Promise<{ token: string }> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
      const user = await UserModel.findById(decoded.id);

      if (!user || user.token !== token) {
        throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }

      const newToken = this.generateAccessToken(user.toObject() as User);
      return { token: newToken };
    } catch (error) {
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  async createUser(data: Partial<User>): Promise<User> {
    // Check if the user already exists
    const existingUser = await UserModel.findOne({ username: data.username }).exec();
    if (existingUser) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = new UserModel({ ...data, password: hashedPassword });
    await user.save();
    return user.toObject() as User;
}
  async updatePassword(username: string, password: string): Promise<User> {
    // Validate password input
    if (!password || typeof password !== 'string') {
      throw new HttpException('Password is required and must be a string', HttpStatus.BAD_REQUEST);
    }

    try {
      // Hash the new password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await UserModel.findOneAndUpdate(
        { username: username },
        { password: hashedPassword },
        { new: true }
      );

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return user.toObject() as User;
    } catch (error) {
      throw new HttpException('Failed to update password', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    return user ? (user.toObject() as User) : null;
  }

  async getAllUsers(): Promise<String[]> {
    const users = await UserModel.find();
    users.map(user => user.toObject() as User);
    return users.filter(user => !user.isAdmin).map(user => user.username);
  }

  async deleteUserByUsername(username: string): Promise<User | null> {
    const user = await UserModel.findOneAndDelete({ username }).exec();
    if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user.toObject() as User;
}
}