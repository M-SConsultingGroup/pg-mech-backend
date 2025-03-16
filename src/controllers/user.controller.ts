// src/controllers/user.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { UserService } from '@/services/user.service';
import { User } from '@/common/interfaces';
import { AuthGuard } from '@nestjs/passport';
import { LoginRequest, LoginResponse } from '@/models/dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  async createUser(@Body() createUserDto: Partial<User>): Promise<User> {
    return this.userService.createUser(createUserDto);
  }

  @Get('all')
  @UseGuards(AuthGuard('jwt'))
  async getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginRequest): Promise<LoginResponse> {
    const {token, user} = await this.userService.login(loginDto.username, loginDto.password);

    return {
      status: 200,
      message: 'Login successful',
      token: token,  // Returning the token from the service
      user: user,  // Returning the user object from the service
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return this.userService.getUserById(id);
  }
}