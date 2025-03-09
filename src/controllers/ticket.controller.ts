// src/controllers/ticket.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { TicketService } from '@/services/ticket.service';
import { Ticket } from '@/common/interfaces';
import { AuthGuard } from '@nestjs/passport';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }

  @Post('create')
  async createTicket(@Body() createTicketDto: Partial<Ticket>): Promise<Ticket> {
    return this.ticketService.createTicket(createTicketDto);
  }

  @Get('get-all')
  @UseGuards(AuthGuard('jwt'))
  async getTickets(): Promise<Ticket[]> {
    return this.ticketService.getAllTickets();
  }

  @Get(':id')
  async getTicket(@Param('id') id: string): Promise<Ticket | null> {
    return this.ticketService.getTicketById(id);
  }

  @Patch(':id')
  async updateTicket(@Param('id') id: string, @Body() updateTicketDto: Partial<Ticket>): Promise<Ticket | null> {
    return this.ticketService.updateTicket(id, updateTicketDto);
  }

  @Delete(':id')
  async deleteTicket(@Param('id') id: string): Promise<Ticket | null> {
    return this.ticketService.deleteTicket(id);
  }
}