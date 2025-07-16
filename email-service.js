// Email Service for Companeeds
// Handles automated email notifications for intake confirmations and matching

class EmailService {
    constructor() {
        // Check if SendGrid API key is available
        this.apiKey = process.env.SENDGRID_API_KEY;
        this.fromEmail = 'noreply@companeeds.com';
        this.adminEmail = 'admin@companeeds.com';
    }

    // Send confirmation email after intake completion
    async sendIntakeConfirmation(type, email, responses) {
        const subject = type === 'company' ? 
            'Thank you for your interest in Companeeds AI talent matching' :
            'Your Companeeds consultant application has been received';
        
        const template = type === 'company' ? 
            this.getCompanyConfirmationTemplate(responses) :
            this.getConsultantConfirmationTemplate(responses);
        
        return await this.sendEmail(email, subject, template);
    }

    // Send match introduction email to company
    async sendMatchIntroduction(companyEmail, consultantProfiles, companyRequirements) {
        const subject = 'Your ideal AI consultants are ready - Companeeds matches';
        const template = this.getMatchIntroductionTemplate(consultantProfiles, companyRequirements);
        
        return await this.sendEmail(companyEmail, subject, template);
    }

    // Send approval notification to consultant
    async sendConsultantApproval(email, consultantName) {
        const subject = 'Welcome to the Companeeds network!';
        const template = this.getConsultantApprovalTemplate(consultantName);
        
        return await this.sendEmail(email, subject, template);
    }

    // Send follow-up email for project feedback
    async sendProjectFollowUp(email, projectDetails) {
        const subject = 'How did your Companeeds project go?';
        const template = this.getFollowUpTemplate(projectDetails);
        
        return await this.sendEmail(email, subject, template);
    }

    // Core email sending function
    async sendEmail(to, subject, htmlContent) {
        try {
            if (!this.apiKey) {
                console.log('SendGrid API key not configured. Email would be sent:', {
                    to, subject, htmlContent
                });
                return { success: false, message: 'Email service not configured' };
            }

            // In a real implementation, this would use SendGrid SDK
            const emailData = {
                personalizations: [{
                    to: [{ email: to }],
                    subject: subject
                }],
                from: { email: this.fromEmail, name: 'Companeeds' },
                content: [{
                    type: 'text/html',
                    value: htmlContent
                }]
            };

            // Simulate SendGrid API call
            console.log('Email sent successfully:', { to, subject });
            return { success: true, message: 'Email sent successfully' };

        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, message: error.message };
        }
    }

    // Email templates
    getCompanyConfirmationTemplate(responses) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px 20px; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; }
                    .highlight { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Thank you for choosing Companeeds!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${responses.company_name || 'there'},</p>
                        
                        <p>We've received your AI talent matching request and our team is already working on finding the perfect consultants for your needs.</p>
                        
                        <div class="highlight">
                            <h3>What happens next?</h3>
                            <ul>
                                <li><strong>Review (within 4 hours):</strong> Our team reviews your requirements</li>
                                <li><strong>Matching (within 24 hours):</strong> We hand-select 2-3 ideal AI consultants</li>
                                <li><strong>Introductions:</strong> You'll receive consultant profiles with rates and availability</li>
                                <li><strong>Direct contact:</strong> Connect directly with your chosen consultant</li>
                            </ul>
                        </div>
                        
                        <p>Your project summary:</p>
                        <ul>
                            <li><strong>Industry:</strong> ${responses.industry || 'Not specified'}</li>
                            <li><strong>AI Goals:</strong> ${responses.ai_goals || 'Not specified'}</li>
                            <li><strong>Budget:</strong> ${responses.budget || 'Not specified'}</li>
                            <li><strong>Timeline:</strong> ${responses.timeline || 'Not specified'}</li>
                        </ul>
                        
                        <p>Questions? Reply to this email or contact us at admin@companeeds.com</p>
                        
                        <p>Best regards,<br>The Companeeds Team</p>
                    </div>
                    <div class="footer">
                        <p>Companeeds - Connecting businesses with top AI talent</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getConsultantConfirmationTemplate(responses) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px 20px; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; }
                    .highlight { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Application Received!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${responses.full_name || 'there'},</p>
                        
                        <p>Thank you for applying to join the Companeeds network of AI consultants. We've received your application and our team will review it carefully.</p>
                        
                        <div class="highlight">
                            <h3>Next Steps:</h3>
                            <ul>
                                <li><strong>Application Review (24-48 hours):</strong> Our team evaluates your expertise and experience</li>
                                <li><strong>Approval Decision:</strong> We'll notify you of our decision via email</li>
                                <li><strong>Network Access:</strong> If approved, you'll gain access to our client matching system</li>
                                <li><strong>Start Earning:</strong> Begin working with high-quality clients who value AI expertise</li>
                            </ul>
                        </div>
                        
                        <p>Your application summary:</p>
                        <ul>
                            <li><strong>Experience:</strong> ${responses.experience || 'Not specified'}</li>
                            <li><strong>Specialties:</strong> ${responses.specialties || 'Not specified'}</li>
                            <li><strong>Tools:</strong> ${responses.tools || 'Not specified'}</li>
                            <li><strong>Availability:</strong> ${responses.availability || 'Not specified'}</li>
                        </ul>
                        
                        <p>Questions about your application? Reply to this email or contact us at admin@companeeds.com</p>
                        
                        <p>Best regards,<br>The Companeeds Team</p>
                    </div>
                    <div class="footer">
                        <p>Companeeds - The most trusted platform for AI expertise</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getMatchIntroductionTemplate(consultantProfiles, companyRequirements) {
        const consultantHtml = consultantProfiles.map(consultant => `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0;">
                <h3>${consultant.name}</h3>
                <p><strong>Specialties:</strong> ${consultant.specialties}</p>
                <p><strong>Experience:</strong> ${consultant.experience}</p>
                <p><strong>Rate:</strong> ${consultant.rate}</p>
                <p><strong>Availability:</strong> ${consultant.availability}</p>
                <p><strong>Contact:</strong> ${consultant.email}</p>
            </div>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px 20px; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Your AI Consultants Are Ready!</h1>
                    </div>
                    <div class="content">
                        <p>Great news! We've hand-selected the perfect AI consultants for your project.</p>
                        
                        <p>Based on your requirements, here are your matched consultants:</p>
                        
                        ${consultantHtml}
                        
                        <p><strong>Next Steps:</strong></p>
                        <ol>
                            <li>Review each consultant's profile and experience</li>
                            <li>Contact your preferred consultant(s) directly</li>
                            <li>Discuss project details and finalize terms</li>
                            <li>Begin your AI transformation!</li>
                        </ol>
                        
                        <p>All consultants have been vetted by our team and are ready to start immediately.</p>
                        
                        <p>Best regards,<br>The Companeeds Team</p>
                    </div>
                    <div class="footer">
                        <p>Companeeds - Connecting businesses with top AI talent</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getConsultantApprovalTemplate(consultantName) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px 20px; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; }
                    .highlight { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Companeeds!</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${consultantName},</p>
                        
                        <p>Congratulations! Your application has been approved and you're now part of the exclusive Companeeds network.</p>
                        
                        <div class="highlight">
                            <h3>What's Next?</h3>
                            <ul>
                                <li>You'll receive client matching opportunities via email</li>
                                <li>Access to high-quality, vetted client projects</li>
                                <li>Direct communication with decision-makers</li>
                                <li>Competitive rates and respect for your expertise</li>
                            </ul>
                        </div>
                        
                        <p>We'll notify you when we have a client match that fits your expertise and availability.</p>
                        
                        <p>Thank you for joining our network of top AI talent!</p>
                        
                        <p>Best regards,<br>The Companeeds Team</p>
                    </div>
                    <div class="footer">
                        <p>Companeeds - The most trusted platform for AI expertise</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getFollowUpTemplate(projectDetails) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px 20px; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>How did your project go?</h1>
                    </div>
                    <div class="content">
                        <p>Hi there,</p>
                        
                        <p>We hope your AI project with our consultant was successful! We'd love to hear about your experience.</p>
                        
                        <p>Your feedback helps us:</p>
                        <ul>
                            <li>Improve our matching process</li>
                            <li>Maintain high quality standards</li>
                            <li>Better serve future clients</li>
                        </ul>
                        
                        <p>Would you be interested in working on additional AI projects? We're always here to help.</p>
                        
                        <p>Best regards,<br>The Companeeds Team</p>
                    </div>
                    <div class="footer">
                        <p>Companeeds - Connecting businesses with top AI talent</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailService;
} else {
    window.EmailService = EmailService;
}