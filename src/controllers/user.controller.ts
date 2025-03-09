// src/controllers/user.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from '@/services/user.service';
import { User } from '@/common/interfaces';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  async createUser(@Body() createUserDto: Partial<User>): Promise<User> {
    return this.userService.createUser(createUserDto);
  }

  @Get('get-all')
  async getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return this.userService.getUserById(id);
  }
}