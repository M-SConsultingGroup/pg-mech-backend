import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { UserService } from '@/services/user.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

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
}