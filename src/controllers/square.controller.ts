import { LineItem, Ticket } from '@/common/interfaces';
import { SquareService } from '@/services/square.service';
import { Body, Controller, Post, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('square')
export class SquareController {

	constructor(private readonly squareService: SquareService) { }

	@Post('create-invoice')
	@UseGuards(AuthGuard('jwt'))
	async createInvoice(@Body('ticket') ticket: Ticket, @Body('lineItems') lineItems: LineItem[], @Body('payment') payment: {card: boolean, bankAccount: boolean}) {

		const customerId = await this.squareService.searchCustomer(ticket.email, ticket.name, ticket.phoneNumber, ticket.serviceAddress);
		if (!customerId) {
			throw new HttpException('Failed to create or find customer', HttpStatus.INTERNAL_SERVER_ERROR);
		}

		const orderId = await this.squareService.createOrder(customerId, lineItems);
		if (!orderId) {
			throw new HttpException('Failed to create or find order', HttpStatus.INTERNAL_SERVER_ERROR);
		}

		const {invoice , errors} = await this.squareService.createInvoice(orderId, customerId, ticket, payment)

		if(errors) {
			throw new HttpException(errors, HttpStatus.INTERNAL_SERVER_ERROR)
		}

		// Return the draft invoice details without publishing
		return {
			message: 'Invoice saved as draft successfully',
			invoiceUrl: invoice?.publicUrl,
			invoiceId: invoice?.id,
			invoiceNumber: invoice?.invoiceNumber
		}
	}
}