import { Injectable } from "@nestjs/common";
import * as twilio from 'twilio';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
const nodemailer = require('nodemailer');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const crypto = require('crypto');

@Injectable()
export class NotificationService {
    constructor(
        private readonly httpService: HttpService
    ) { }

    async sendSMSTwilio(otp?: string, mobileNumber?: string) {
        try {
            const client = twilio("", "");
            const response = await client.messages.create({
                body: `${otp}`,
                from: '+12314987096', // Replace with your Twilio number
                to: `+91${mobileNumber}`,
            });

            console.log('Message sent successfully:', response.sid);
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }

    async sendSMSMsg91(otp?: string, mobileNumber?: string) {
        const msg91AuthKey = '446596AYrR8o4De67f955f4P1';
        const senderId = 'STREET';

        const url = `https://control.msg91.com/api/v5/flow/`;
        try {
            const payload = {
                flow_id: 'YOUR_FLOW_ID', // from Msg91 Flow (template)
                sender: senderId,
                mobiles: `91${mobileNumber}`,
                VAR1: otp, // Replace with your variables in template
            };

            const headers = {
                'Content-Type': 'application/json',
                'authkey': msg91AuthKey,
            };

            const response = await firstValueFrom(
                this.httpService.post(url, payload, { headers }),
            );

            console.log(`SMS sent successfully: ${JSON.stringify(response.data)}`);
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }

    async sendOtpViaEmail(userEmail: string, otp?: string) {
        // Create transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail', // or your service like 'outlook', 'yahoo', etc.
            auth: {
                user: process.env.EMAIL_USR,
                pass: process.env.EMAIL_PASS, // Not your normal password. Use App Passwords.
            },
        });

        // Email options
        const mailOptions = {
            from: 'streetnoshery@gmail.com',
            to: userEmail,
            subject: 'Your Street Noshery Verification Code',
            text: 'Hello! This is a test email sent using Node.js',
            headers: {
                'Message-ID': `${crypto.randomUUID()}@streetnoshery.com`,
                'X-Entity-Ref-ID': `${Date.now()}`
            },
            html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Your OTP Code</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: Arial, sans-serif; color: #333;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <tr style="background-color: #AEC3B0;">
                  <td style="padding: 20px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0;">🔒 Verification Code</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px;">
                    <p style="font-size: 16px;">Hello,</p>
                    <p style="font-size: 16px; line-height: 1.5;">
                      Thank you for using our service. To complete your verification, please use the following One-Time Password (OTP):
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <span style="display: inline-block; background-color: #AEC3B0; color: #ffffff; padding: 15px 30px; font-size: 24px; border-radius: 6px; letter-spacing: 3px;">
                        ${otp}
                      </span>
                    </div>
                    <p style="font-size: 14px; color: #555;">
                      This OTP is valid for the next 10 minutes. If you did not request this, please ignore this email.
                    </p>
                    <p style="font-size: 16px;">Best regards,<br><strong>Street Noshery</strong></p>
                  </td>
                </tr>
                <tr style="background-color: #f4f4f7;">
                  <td style="padding: 20px; text-align: center; font-size: 12px; color: #888;">
                    © 2025 Street Noshery. All rights reserved.
                  </td>
                </tr>
              </table>
            </body>
            </html>
            `,
        };

        // Send email
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent: ', info.response);
        } catch (error) {
            console.error('Error sending email: ', error);
        }
    }

    async sendEmailViaAWS(otp?: string) {
        // Configure AWS SES client
        const ses = new SESClient({
            region: 'ap-south-1', // change as per your region
            // credentials: {
            //     accessKeyId: 'abcd',
            //     secretAccessKey: 'abcd',
            // },
        });

        const params = {
            Destination: {
                ToAddresses: ["sumitgod510@gmail.com"],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="UTF-8">
                    <title>Your OTP Code</title>
                  </head>
                  <body>
                    <h1>Your OTP is: ${otp}</h1>
                    <p>This OTP is valid for 10 minutes.</p>
                  </body>
                  </html>
                  `,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "Your OTP Code",
                },
            },
            Source: "streetnoshery@gmail.com",
        };

        try {
            const result = await ses.send(new SendEmailCommand(params));
            console.log("Email sent successfully!", result);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
}