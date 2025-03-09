// src/services/user.service.ts
import UserModel from '@/models/user';
import { User } from '@/common/interfaces';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  async createUser(data): Promise<User> {
    const user = new UserModel(data);
    await user.save();
    return user.toObject() as User;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    return user ? (user.toObject() as User) : null;
  }
  
  async getAllUsers(): Promise<User[]> {
    const users = await UserModel.find();
    return users.map(user => user.toObject() as User);
  }
}