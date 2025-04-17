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
    const user = (await UserModel.findOne({ username }).exec()).toObject() as User;
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Check the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Generate access token (short-lived)
    const token = this.generateAccessToken(user);
    
    // Generate refresh token (long-lived)
    const refreshToken = this.generateRefreshToken(user);
    
    // Save refresh token to user document
    await UserModel.findByIdAndUpdate(user.id, { refreshToken });

    return {
      status: 200,
      message: 'Login successful',
      token, 
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      }
    };
  }

  private generateAccessToken(user: User): string {
    return jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short expiration for security
    );
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Longer expiration for refresh tokens
    );
  }

  async validateToken(token: string): Promise<any> {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded === 'string' || decoded?.exp < Date.now() / 1000) {
      return { valid : false, decoded };
    }
    const user = await UserModel.findById(decoded.id);

    return { ...decoded, user: user ? user.toObject() : null, valid:true   };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ token: string }> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as { id: string };
      const user = await UserModel.findById(decoded.id);
      
      if (!user || user.refreshToken !== refreshToken) {
        throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }

      const newToken = this.generateAccessToken(user.toObject() as User);
      return { token: newToken };
    } catch (error) {
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  async createUser(data): Promise<User> {
    const user = new UserModel(data);
    await user.save();
    return user.toObject() as User;
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
}