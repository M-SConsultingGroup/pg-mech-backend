import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './common/jwt.strategy';
import { AuthController } from './controllers/auth.controller';
import { UserService } from './services/user.service';
import { UserModule } from './user.module';

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt'}),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' }  // Longer expiration for refresh tokens
    }),
  ],
  providers: [JwtStrategy, UserService],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}