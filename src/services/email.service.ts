import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
	async sendEmail(to: string, subject: string, message: string): Promise<any> {
		const mailOptions: nodemailer.SendMailOptions = {
			from: `info@${process.env.NEXT_PUBLIC_SITE_NAME}`,
			to,
			subject,
			text: message,
		};

		try {
			const transporter = nodemailer.createTransport(/* your smtp config */);
			const info = await transporter.sendMail(mailOptions);

			// Call saveToSent but do not await or fail on it
			saveToSent(mailOptions).catch((error) => {
				console.error("Non-blocking save to Sent error:", error);
			});

			return { response: info, success: true };
		} catch (error) {
			console.error("Email sending error:", error);
			throw new Error('Internal server error');
		}
	}
}

// Mock function for saving sent emails, replace with real implementation
function saveToSent(mailOptions: nodemailer.SendMailOptions) {
	return Promise.resolve();
}