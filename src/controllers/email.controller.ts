import { EmailService } from '@/services/email.service';
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';

@Controller('email')
export class EmailController {
	constructor(private readonly emailService: EmailService) { }

	@Post('send')
	async sendEmail(@Body() body: { to: string; subject: string; message: string; isHtml?: boolean; }) {
		const { to, subject, message, isHtml } = body;

		if (!to || !subject || !message) {
			throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
		}

		try {
			const result = await this.emailService.sendEmail({ to, subject, message, isHtml });
			return {
				statusCode: HttpStatus.OK,
				data: result
			};
		} catch (error) {
			throw new HttpException(
				'Internal server error',
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}
}
