// src/services/user.service.ts
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import UserModel from '@/models/schema/user';
import { User } from '@/common/interfaces';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginResponse } from '@/models/dto/user.dto';

@Injectable()
export class UserService {
  async login(username: string, password: string): Promise<Partial<LoginResponse>> {
    const user = (await UserModel.findOne({ username }).exec()).toObject() as User;
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Check the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Generate a token
    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    return { token, user };
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