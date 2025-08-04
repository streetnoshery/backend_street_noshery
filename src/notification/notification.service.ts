import { Injectable } from "@nestjs/common";
import * as twilio from 'twilio';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from "src/logger/logger.service";
import { MailDto, MobileNumbersDto } from "./dto/notification.dto";
import { StreetNosheryEmailModelHelperService } from "./model/email.model-helper.service";
const nodemailer = require('nodemailer');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail')
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NotificationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
    private readonly emailModelHelperService: StreetNosheryEmailModelHelperService
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

      this.logger.log(`SMS sent successfully: ${JSON.stringify(response)}`);
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
      this.logger.log(`[NOTIFICATION_LISTNER_SERVICE] (sendPromotionalEmail) Sending email to users`)

      this.sendPromotionalEmailCoupons(emails, transporter);

      return true
    } catch (error) {
      throw error;
    }
  }

  async sendEmailViaSendGrid(emails: MailDto) {
    try {
      // Create transporter
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)

      this.sendPromotionalEmailViaSendGrid(emails);

      return true
    } catch (error) {
      throw error;
    }
  }

  async sendPromotionalEmailViaSendGrid(emails: MailDto) {
    for (var userEmail of emails.emails) {
      const { mobile, email } = userEmail;
      const promotionalCode = "NOSH10"

      const emailUserDB = await this.emailModelHelperService.getUserEmail({ email });
      if (emailUserDB?.promotionalCode == promotionalCode) {
        this.logger.log(`Already sent email for emailID: ${email}`)
        continue;
      }

      console.log(`email:----------> ${email}`)
      const msg = {
        name: 'Street Noshery',
        to: email, // Change to your recipient
        from: "Street Noshery <streetnoshery@gmail.com>", // Change to your verified sender
        subject: `🤤 Bhukh lagi hai? Toh chalo Street Noshery!`,
        text: `Street Noshery`,
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Street Noshery</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: 'Arial', sans-serif;
              overflow: hidden;
            }
        
            .background {
              background: url('https://images.unsplash.com/photo-1504674900247-0877df9cc836') no-repeat center center fixed;
              background-size: cover;
              position: fixed;
              top: 0; left: 0; right: 0; bottom: 0;
              filter: blur(8px);
              z-index: -1;
            }
        
            .wrapper {
          background: rgba(255, 255, 255, 0.95);
          width: 300px;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          padding: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          text-align: center;
          margin: 20px auto 60px; /* 👈 Added 30px margin at bottom */
        }
        
        
            .header-row {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              margin-bottom: 6px;
            }
        
            .logo {
              width: 22px;
              height: 22px;
              object-fit: contain;
            }
        
            .cafe-name {
              font-size: 0.85rem;
              color: #000000;
              font-weight: bold;
            }
        
            .image-container {
              position: relative;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
              margin-bottom: 6px;
            }
        
            .cafe-image {
              width: 100%;
              display: block;
            }
        
            .timing-overlay {
              position: absolute;
              bottom: 0;
              width: 100%;
              background: rgba(0, 0, 0, 0.75);
              color: #fff;
              font-size: 0.9rem;
              font-weight: bold;
              padding: 8px 0;
            }
        
            .offer {
              font-size: 0.8rem;
              line-height: 1.3;
              color: #333;
            }
        
            .offer strong {
              display: block;
              margin-bottom: 4px;
              font-size: 0.9rem;
              color: #d62828;
            }
          </style>
        </head>
        <body>
          <div class="background"></div>
          <div class="wrapper">
            <div class="header-row">
              <img class="logo" src="logo.png" alt="Street Noshery Logo" />
              <div class="cafe-name">Welcome to Street Noshery!</div>
            </div>
        
            <div class="image-container">
              <img class="cafe-image" src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5" alt="Fruit Bowl">
              <div class="timing-overlay">🕒 Open Daily: 10:00 AM – 10:00 PM</div>
            </div>
        
        <!-- Main Content -->
                    <tr>
                      <td style="padding:0px 20px;">
                        <h3 style="color:#333;">🎁 Special Offer</h3>
                        <p style="font-size:14px;">Get <strong>10% OFF</strong> on your first visit. Come hungry!</p>
                        <p style="font-size:14px;">Bring your friends and enjoy a flavorful time together.</p>
                
                        <!-- Coupon Code -->
                        <div style="background-color:#f9f9f9; border:1px solid #AEC3B0; padding:15px; margin:25px 0; text-align:center; border-radius:6px;">
                          <p style="font-size:16px; margin:0 0 5px;">🍽️ Use Code: <strong style="color:#AEC3B0;">${promotionalCode}</strong></p>
                          <p style="font-size:14px; color:#555; margin:5px 0 0;">Apply at checkout or show at the counter</p>
                        </div>
                
                        <!-- Swiggy and Zomato Links -->
                        <div style="text-align:center; margin:10px 0;">
                <p style="font-size:16px; font-weight:bold; margin-bottom:10px;">🛵 Order Online</p>
                
                <a href="https://www.swiggy.com/menu/1150537?source=sharing" target="_blank" style="margin: 0 15px; text-decoration: none;">
                  <img src="https://images.yourstory.com/cs/images/companies/logosC141575978425306png?fm=auto&ar=1:1&mode=fill&fill=solid&fill-color=fff" alt="Swiggy" width="80" style="vertical-align: middle; border-radius: 8px;">
                </a>
                
                <a href="https://zomato.onelink.me/xqzv/tqd89dj6" target="_blank" style="margin: 0 15px; text-decoration: none;">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Zomato_logo.png/600px-Zomato_logo.png" alt="Zomato" width="80" style="vertical-align: middle; border-radius: 8px;">
                </a>
                </div>
                
                        <!-- Google Maps Button -->
                        <div style="text-align:center; margin:20px 0;">
                          <a href="https://rb.gy/ls9pfs" target="_blank" style="display:inline-block; background-color:#AEC3B0; color:#ffffff; padding:10px 30px; font-size:16px; border-radius:6px; text-decoration:none;">
                            📍 Find Us on Google Maps
                          </a>
                        </div>
                
                        <p style="font-size:14px;">See you soon at <strong>Street Noshery</strong>!</p>
                      </td>
                    </tr>
                    <!-- Footer -->
                <tr style="background-color:#f4f4f7;">
                <td style="padding: 20px; text-align: center; font-size: 12px; color: #888; font-family: Arial, sans-serif;">
                
                  You are receiving this email because you visited or interacted with Street Noshery.<br>
                  <a href="mailto:streetnoshery@gmail.com?subject=Unsubscribe" style="color:#888; text-decoration:none;">Unsubscribe</a> if you no longer want emails from us.<br><br>
                
                  <!-- Instagram and Phone in Same Row -->
                  <table align="center" style="margin: 0 auto;">
                    <tr>
                      <!-- Instagram -->
                      <td style="padding-right: 15px;">
                        <a href="https://www.instagram.com/street.noshery?igsh=eXdpcHBlczR1NjUw&utm_source=qr" target="_blank" style="text-decoration: none; color: #555;">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" width="20" height="20" style="vertical-align: middle; border-radius: 4px;">
                          <span style="margin-left: 5px; font-size: 14px; vertical-align: middle;">@streetnoshery</span>
                        </a>
                      </td>
                
                      <!-- Phone -->
                      <td>
                        <span style="font-size: 14px; color: #555;">
                          📞 <a href="tel:+918107748619" style="color: #555; text-decoration: none;">+91 81077 48619</a>
                        </span>
                      </td>
                    </tr>
                  </table><br>
                
                  © 2025 Street Noshery. All rights reserved.
                </td>
                </tr>
          </div>
        </body>
        </html>`,
      }
      sgMail
        .send(msg)
        .then(async (res) => {
          const updatedEmail = await this.emailModelHelperService.createUserEmail({ email, mobileNumbers: mobile, promotionalCode });
          this.logger.log(`updated email: ${JSON.stringify(updatedEmail)}`)
          this.logger.log('Email sent: ', res);
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }

  async sendPromotionalEmailCoupons(emails: MailDto, transporter: any) {
    for (var userEmail of emails.emails) {

      const { mobile, email } = userEmail;
      const promotionalCode = "NOSH20"

      const emailUserDB = await this.emailModelHelperService.getUserEmail({ email });
      if (emailUserDB?.promotionalCode == promotionalCode) {
        this.logger.log(`Already sent email for emailID: ${email}`)
        continue;
      }

      let htmlContent = fs.readFileSync(
        path.join(__dirname, '..', '..', 'src', 'notification', 'notification-html.html'),
        'utf-8'
      );
      
      // Replace placeholder with actual code
      htmlContent = htmlContent.replace('{{promotionalCode}}', promotionalCode);
      // Email options
      const mailOptions = {
        service: 'gmail',
        from: 'streetnoshery@gmail.com',
        to: email,
        subject: `🤤 Bhukh lagi hai? Toh chalo Street Noshery!`,
        text: ``,
        headers: {
          'Message-ID': `${crypto.randomUUID()}@streetnoshery.com`,
          'X-Entity-Ref-ID': `${Date.now()}`
        },
        html: htmlContent
      };

      //       <!DOCTYPE html>
      // <html>
      //   <head>
      //     <meta charset="UTF-8" />
      //     <title>Street Noshery Offer</title>
      //     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      //     <style>
      //       body {
      //         margin: 0;
      //         padding: 0;
      //         background-color: #f0f0f0;
      //         font-family: Arial, sans-serif;
      //       }

      //       .card-container {
      //         max-width: 600px;
      //         margin: auto;
      //         border-radius: 16px;
      //         overflow: hidden;
      //         box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      //         background-color: #ffffff;
      //         position: relative;
      //       }

      //       .top-info {
      //         position: absolute;
      //         top: 15px;
      //         left: 15px;
      //         background-color: #aec3b0;
      //         padding: 8px 12px;
      //         border-radius: 12px;
      //         display: flex;
      //         align-items: center;
      //         z-index: 3;
      //       }

      //       .top-info img {
      //         width: 28px;
      //         height: 28px;
      //         margin-right: 8px;
      //       }

      //       .top-info-text {
      //         font-size: 13px;
      //         line-height: 1.2;
      //         color: #333;
      //       }

      //       .top-info-text strong {
      //         font-weight: bold;
      //         font-size: 14px;
      //         display: block;
      //       }

      //       .content {
      //         padding: 80px 20px 20px 20px;
      //         text-align: center;
      //       }

      //       h1 {
      //         color: #333;
      //         font-size: 24px;
      //         margin-bottom: 10px;
      //       }

      //       p {
      //         color: #666;
      //         font-size: 16px;
      //         margin-bottom: 20px;
      //       }

      //       .button {
      //         display: inline-block;
      //         padding: 12px 24px;
      //         background-color: #63a375;
      //         color: #ffffff;
      //         text-decoration: none;
      //         border-radius: 8px;
      //         font-weight: bold;
      //         font-size: 16px;
      //         transition: background-color 0.3s ease;
      //       }

      //       .button:hover {
      //         background-color: #4e8f61;
      //       }
      //     </style>
      //   </head>
      //   <body>
      //     <div class="card-container">
      //       <!-- Top Left Logo and Text -->
      //       <div class="top-info">
      //         <img
      //           src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
      //           alt="Instagram"
      //         />
      //         <div class="top-info-text">
      //           <strong>Street Noshery</strong>
      //           Swad Ghar Ka with Low Budget
      //         </div>
      //       </div>

      //       <!-- Main Content -->
      //       <div class="content">
      //         <h1>Get 20% Off Your First Order!</h1>
      //         <p>Try the best homemade flavors today. Order online and enjoy the taste of home.</p>
      //         <a href="https://streetnoshery.com" class="button">Order Now</a>
      //       </div>
      //     </div>
      //   </body>
      // </html>


      // Send email
      try {
        this.logger.log(`Sending email for emailId: ${email}`)
        const info = await transporter.sendMail(mailOptions);
        const updatedEmail = await this.emailModelHelperService.createUserEmail({ email, mobileNumbers: mobile, promotionalCode });
        this.logger.log(`updated email: ${JSON.stringify(updatedEmail)}`)
        this.logger.log('Email sent: ', info.response);
      } catch (error) {
        this.logger.error(`Error sending email for emailId: ${email} | Error: ${JSON.stringify(error)} `);
      }
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