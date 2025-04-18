import { Controller, Post, Body, Res, HttpStatus, Param, Get, HttpCode, Headers } from '@nestjs/common';
import { UserService } from '@/services/user.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) { }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }, @Res() res: Response) {
    try {
      const { token } = await this.userService.refreshAccessToken(body.refreshToken);
      return res.status(HttpStatus.OK).json({ token });
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Invalid refresh token',
        status: HttpStatus.UNAUTHORIZED
      });
    }
  }

  @Get('validate')
  @HttpCode(200)
  async validate(@Headers('authorization') authHeader: string) {
    // Extract token from "Bearer <token>"
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }
    const response = await this.userService.validateToken(token);
    return response;
  }
  
}