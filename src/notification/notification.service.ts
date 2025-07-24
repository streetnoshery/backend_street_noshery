import { Injectable } from "@nestjs/common";
import * as twilio from 'twilio';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from "src/logger/logger.service";
import { MailDto, MobileNumbersDto } from "./dto/notification.dto";
const nodemailer = require('nodemailer');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const crypto = require('crypto');

@Injectable()
export class NotificationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggerService
  ) { }

  async sendSMSTwilio(otp?: string, mobileNumber?: string) {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const response = await client.messages.create({
        body: `${otp}`,
        from: '+12314987096', // Replace with your Twilio number
        to: `+91${mobileNumber}`,
      });

      this.logger.log('Message sent successfully:', response.sid);
    } catch (error) {
      this.logger.error('Failed to send message:', error);
      throw error;
    }
  }

  async sendWhatsAppMessages(mobileNumbers: MobileNumbersDto) {
    try {
      for (var mobileNumber of mobileNumbers.mobileNumbers) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const response = await client.messages.create({
          from: 'whatsapp:+918310627564',  // Your registered business number
          to: `whatsapp:+91${mobileNumber}`,    // Customer's number
          contentSid: 'HX6bff99b3a6a88f0cf7eff13a2835b59c' // From Twilio Console
          // contentVariables: JSON.stringify({
          //   "1": "Sumit",        // {{1}} = Sumit
          //   "2": "20%"           // {{2}} = 20%
          // })
        })
        this.logger.log(`Message sent successfully: ${JSON.stringify(response)}`);
      }
    } catch (error) {
      this.logger.error('Failed to send message:', error);
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

      this.logger.log(`SMS sent successfully: ${JSON.stringify(response.data)}`);
    } catch (error) {
      this.logger.error('Failed to send message:', error);
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
      this.logger.log('Email sent: ', info.response);
    } catch (error) {
      this.logger.error('Error sending email: ', error);
    }
  }

  async sendPromotionalEmail(emails: MailDto) {
    try {
      // Create transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail', // or your service like 'outlook', 'yahoo', etc.
        auth: {
          user: process.env.EMAIL_USR,
          pass: process.env.EMAIL_PASS, // Not your normal password. Use App Passwords.
        },
      });

      for (var email of emails.emails) {
        // Email options
        const mailOptions = {
          service: 'gmail',
          from: 'streetnoshery@gmail.com',
          to: email,
          subject: 'A Special Treat Awaits You at Street Noshery!',
          text: ``,
          headers: {
            'Message-ID': `${crypto.randomUUID()}@streetnoshery.com`,
            'X-Entity-Ref-ID': `${Date.now()}`
          },
          html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Welcome to Street Noshery</title>
            </head>
            <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:Arial, sans-serif; color:#333;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background-color:#ffffff; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.1); overflow:hidden;">
                <tr style="background-color:#AEC3B0;">
                  <td style="padding:20px; text-align:center; color:#ffffff;">
                    <h1 style="margin:0;">Street Noshery</h1>
                    <p style="margin:5px 0 0;">Comfort food with café vibes</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <h2 style="color:#333;">🎁 Special Offer</h2>
                    <p style="font-size:16px;">Get <strong>20% OFF</strong> on your first visit. Come hungry, leave happy!</p>
                    <p style="font-size:16px;">Bring your friends and enjoy a flavorful time together.</p>
                    <div style="text-align:center; margin:30px 0;">
                      <a href="https://rb.gy/ls9pfs" target="_blank" style="display:inline-block; background-color:#AEC3B0; color:#ffffff; padding:15px 30px; font-size:18px; border-radius:6px; text-decoration:none;">
                        📍 Find Us on Google Maps
                      </a>
                    </div>
                    <p style="font-size:14px; color:#555;">
                      📍 <strong>Shop No. 63</strong>, Sector 9 Shopping Centre, Madhyam Marg, Mansarovar, Jaipur – 302020<br>
                      🗺️ <a href="https://rb.gy/ls9pfs" style="color:#AEC3B0;">Click for directions</a>
                    </p>
                    <p style="font-size:16px;">See you soon at <strong>Street Noshery</strong>!</p>
                  </td>
                </tr>
                <tr style="background-color:#f4f4f7;">
                  <td style="padding:20px; text-align:center; font-size:12px; color:#888;">
                    You are receiving this email because you visited or interacted with Street Noshery.<br>
                    <a href="mailto:streetnoshery@gmail.com?subject=Unsubscribe" style="color:#888;">Unsubscribe</a> if you no longer want emails from us.<br><br>
                    © 2025 Street Noshery. All rights reserved.
                  </td>
                </tr>
              </table>
            </body>
          </html>
          `
        };              

        // Send email
        try {
          const info = await transporter.sendMail(mailOptions);
          this.logger.log('Email sent: ', info.response);
        } catch (error) {
          this.logger.error('Error sending email: ', error);
        }
      }
    } catch (error) {

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
      this.logger.log("Email sent successfully!", result);
    } catch (error) {
      this.logger.error('Error sending email:', error);
    }
  }
}