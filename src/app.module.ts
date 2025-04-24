import { Module } from '@nestjs/common';
import { EmailController } from './controllers/email.controller';
import { TicketController } from './controllers/ticket.controller';
import { EmailService } from './services/email.service';
import { TimeEntryService } from './services/timeEntry.service';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { TicketService } from './services/ticket.service';
import { SquareController } from './controllers/square.controller';
import { SquareService } from './services/square.service';  
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EmailController, TicketController, UserController, SquareController],
  providers: [EmailService, TimeEntryService, UserService, TicketService, SquareService],
})
export class AppModule {}
