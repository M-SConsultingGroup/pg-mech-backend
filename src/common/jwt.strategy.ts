import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '@/services/user.service';
import { User } from '@/common/interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Standard header
        (req) => req?.cookies?.accessToken, // Check cookies if using them
      ]),
      ignoreExpiration: false, // Important for expired token handling
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true, // Allows access to request in validate
    });
  }

  async validate(req: Request, payload: any): Promise<User> {
    try {
      // Check if token is expired (will throw if expired)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new UnauthorizedException('Token expired');
      }

      // Find user by ID from payload
      const user = await this.userService.getUserById(payload.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      // Handle token expiration specifically for refresh flow
      if (error.name === 'TokenExpiredError') {
        // Allow expired tokens to proceed if this is a refresh request
        const isRefreshRoute = req.url.includes('/auth/refresh');
        if (isRefreshRoute) {
          return { id: payload.id } as User; // Minimal user info for refresh
        }
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}