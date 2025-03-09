import { EmailService } from '@/services/email.service';
import { Controller, Post } from '@nestjs/common';

@Controller('email')
export class EmailController {
	private emailService = new EmailService();

	@Post('send')
	async post(req: Response) {
		try {
			const { to, subject, message } = await req.json();

			if (!to || !subject || !message) {
				return Response.json({ error: 'Missing required fields' }, { status: 400 });
			}

			const result = await this.emailService.sendEmail(to, subject, message);
			return Response.json(result, { status: 200 });

		} catch (error) {
			console.error("Error in controller:", error);
			return Response.json({ error: error.message }, { status: 500 });
		}
	}
}
