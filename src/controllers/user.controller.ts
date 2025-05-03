import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, Delete } from '@nestjs/common';
import { UserService } from '@/services/user.service';
import { User } from '@/common/interfaces';
import { AuthGuard } from '@nestjs/passport';
import { LoginRequest, LoginResponse } from '@/models/dto/user.dto';
import { AdminGuard } from '@/common/admin.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async createUser(@Body() createUserDto: Partial<User>): Promise<User> {
    return this.userService.createUser(createUserDto);
  }

  @Get('all')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async getAllUsers(): Promise<String[]> {
    return this.userService.getAllUsers();
  }

  @Post('updatePassword')
  @UseGuards(AuthGuard('jwt'))
  async updatePassword(@Body('username') username: string, @Body('password') newPassword: string): Promise<User> {
    return this.userService.updatePassword(username, newPassword);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginRequest): Promise<LoginResponse> {
    return await this.userService.login(loginDto.username, loginDto.password);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return this.userService.getUserById(id);
  }

  @Delete(':username')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async deleteUserById(@Param('username') username: string): Promise<User | null> {
    return this.userService.deleteUserByUsername(username);
  }
}