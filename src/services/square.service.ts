import { LineItem, Ticket } from "@/common/interfaces";
import { Injectable } from "@nestjs/common";
import { SquareClient, SquareEnvironment } from "square";
import { OrderLineItem } from "square/api";


@Injectable()
export class SquareService {

	squareClient: SquareClient;

	constructor() {
		try {
			// Initialize Square client
			const squareClient = new SquareClient({
				environment: SquareEnvironment.Production, // or Environment.Production
				token: process.env.SQUARE_ACCESS_TOKEN,
			});
			this.squareClient = squareClient;
		} catch (error) {
			console.log("not able to connect to square", error)
		}
	}

	async createInvoice(orderId: string, customerId: string, ticket: Ticket, payment: { card: boolean, bankAccount: boolean }) {

		return await this.squareClient.invoices.create({
			invoice: {
				locationId: process.env.SQUARE_LOCATION_ID,
				primaryRecipient: {
					customerId
				},
				paymentRequests: [
					{
						requestType: 'BALANCE',
						dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Due in 2 days
						reminders: [
							{
								relativeScheduledDays: 1,
								message: 'Friendly reminder: Your invoice is due soon'
							}
						]
					}
				],
				deliveryMethod: 'EMAIL',
				acceptedPaymentMethods: {
					card: payment.card,
					squareGiftCard: false,
					bankAccount: payment.bankAccount,
					buyNowPayLater: false
				},
				title: 'Service Invoice',
				description: ticket.additionalNotes,
				orderId,
			},
			idempotencyKey: `invoice_${ticket.ticketNumber}_${Date.now()}`
		});

	}

	async createOrder(customerId: string, lineItems: LineItem[]): Promise<string> {

		const orderItems: OrderLineItem[] = lineItems.map(item => ({
			name: item.name,
			quantity: item.quantity.toString(),
			basePriceMoney: {
				amount: BigInt(Math.round(item.price * 100)),
				currency: 'USD'
			},
			note: item.notes,
		}));

		const order = await this.squareClient.orders.create(
			{
				order: {
					locationId: process.env.SQUARE_LOCATION_ID,
					customerId,
					lineItems: orderItems
				}
			})

		return order.order.id;
	}

	async searchCustomer(email: string, name: string, phoneNumber: string, address: string): Promise<string> {
		let customerId;

		// Search for existing customer by email
		const searchResponse = await this.squareClient.customers.search({
			query: {
				filter: {
					emailAddress: {
						exact: email
					}
				}
			}
		});

		if (searchResponse.customers?.length) {
			customerId = searchResponse.customers[0].id;
		} else {
			// Create new customer
			const createResponse = await this.squareClient.customers.create({
				givenName: name.split(' ')[0],
				familyName: name.split(' ')[1] || '',
				emailAddress: email,
				phoneNumber: phoneNumber,
				address: {
					addressLine1: address
				}
			});
			customerId = createResponse.customer?.id;
		}

		return customerId
	}
}