import { Module } from '@nestjs/common';
import { EmailController } from './controllers/email.controller';
import { TicketController } from './controllers/ticket.controller';
import { EmailService } from './services/email.service';
import { TimeEntryService } from './services/timeEntry.service';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { TicketService } from './services/ticket.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EmailController, TicketController, UserController],
  providers: [EmailService, TimeEntryService, UserService, TicketService],
})
export class AppModule {}
