import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
	to: string;
	subject: string;
	message: string;
	isHtml?: boolean;
}

@Injectable()
export class EmailService {
	private transporter = nodemailer.createTransport({
		host: 'mail.privateemail.com',
		port: 465,
		secure: true,
		auth: {
			user: 'info@pgmechanical.us',
			pass: process.env.EMAIL_PASSWORD,
		},
		pool: true, // Use connection pooling
		maxConnections: 5,
		rateDelta: 1000, // Rate limit to 1 email per second
		rateLimit: 5,
	});

	async sendEmail({ to, subject, message, isHtml = false }: EmailOptions): Promise<any> {
		const mailOptions: nodemailer.SendMailOptions = {
			from: '"PG Mechanical Support" <info@pgmechanical.us>',
			to,
			subject,
			...(isHtml ? { html: message, text: this.htmlToText(message) } : { text: message }),
			headers: {
				'X-Mailer': 'PG Mechanical Support System',
				'X-Priority': '1',
			},
		};

		try {
			// Verify connection first
			await this.transporter.verify();
			const info = await this.transporter.sendMail(mailOptions);

			return {
				success: true,
				messageId: info.messageId,
				accepted: info.accepted,
				rejected: info.rejected
			};
		} catch (error) {
			throw new HttpException(`Failed to send email: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	private htmlToText(html: string): string {
		// Simple conversion - consider using a library like 'html-to-text' for better results
		return html
			.replace(/<[^>]*>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}
}