// Centralized workshop data for easy management
const workshopData = {
  title: "From Idea to Interfaces : A UI/UX foundation workshop",
  shortDescription: "Join us for an exciting 2-day workshop on UI/UX Design, organized by the Websters - Computer Science Society of Shivaji College!",
  isRegistrationOpen: false, // Set to true to open registration
  formSubmittedLink: "/formsubmitted/workshop", // Link to the form submitted page for workshop
  details: [
    { label: '📅 Date:', value: '29th & 30th January, 2025', id: 'date' },
    { label: '🕒 Time:', value: '10 AM - 2 PM', id: 'time' },
    { label: '🏛️ Venue:', value: 'Jijabai Computer Lab', id: 'venue' },
    {
      label: '📖 Description:',
      value: 'From Idea to Interfaces: A UI/UX Foundation Workshop is a 2-day event organized by the Websters - Computer Science Society of Shivaji College. The workshop will cover the basics of UI/UX design, including principles of user interfaces, user experience, wireframing, prototyping, and best design practices with an hands-on project. It\'s an exciting opportunity for beginners and design enthusiasts to learn essential skills for creating user-friendly digital experiences.',
      id: 'description'
    }
  ],
  bannerImage: "/assets/Events/UI-UX_Workshop.png",
  whatsappGroupLink: "https://chat.whatsapp.com/workshop-group-link", // Replace with actual WhatsApp group link
  socialMedia: {
    instagram: "https://www.instagram.com/websters.shivaji/",
    linkedin: "https://www.linkedin.com/company/websters-shivaji-college/"
  },
  emailNotification: {
    subject: "Workshop Registration Confirmed - Websters",
    template: (name) => `
        <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb; color: #374151;">
          <!-- Email Container -->
          <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; margin: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #4f46e5, #8b5cf6); padding: 40px 30px; text-align: center;">
              <img src="https://websters-shivaji.vercel.app/assets/Header_logo.png" alt="Websters Logo" style="height: 60px; margin-bottom: 20px;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">Registration Confirmed!</h1>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px; font-size: 16px; line-height: 1.6;">
              <p style="margin-top: 0;">Hello <span style="font-weight: 600; color: #111827;">${name}</span>,</p>
              
              <p>Thank you for registering for the <span style="font-weight: 600; color: #4f46e5;">"From Idea to Interfaces: A UI/UX Foundation Workshop"</span>. We're excited to have you join us!</p>
              
              <!-- Workshop Details Card -->
              <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #4f46e5;">
                <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">Workshop Details</h3>
                <div style="display: grid; grid-gap: 12px; margin-top: 16px;">
                  <div style="display: flex; align-items: center;">
                    <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">📅 Date:</span>
                    <span>29th & 30th January, 2025</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">🕒 Time:</span>
                    <span>10 AM - 2 PM</span>
                  </div>
                  <div style="display: flex; align-items: center;">
                    <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">🏛️ Venue:</span>
                    <span>Jijabai Computer Lab</span>
                  </div>
                </div>
              </div>
              
              <!-- What to Bring Section -->
              <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #10b981;">
                <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">What to Bring</h3>
                <ul style="margin: 16px 0 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 10px;">Laptop with internet connectivity</li>
                  <li style="margin-bottom: 10px;">Notebook and pen for taking notes</li>
                  <li style="margin-bottom: 10px;">Student ID card</li>
                  <li style="margin-bottom: 0;">Your creativity and enthusiasm!</li>
                </ul>
              </div>
              
              <!-- Important Notes Section -->
              <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #f59e0b;">
                <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">Important Notes</h3>
                <ul style="margin: 16px 0 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 10px;">Please arrive 15 minutes before the scheduled time</li>
                  <li style="margin-bottom: 10px;">Lunch and refreshments will be provided</li>
                  <li style="margin-bottom: 10px;">Certificates will be awarded upon completion of the workshop</li>
                  <li style="margin-bottom: 0;">For any queries, please contact us through the WhatsApp group or email</li>
                </ul>
              </div>
              
              <p>Please join our WhatsApp group for important updates and announcements:</p>
              
              <!-- WhatsApp Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://chat.whatsapp.com/workshop-group-link" style="background-color: #25D366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(37, 211, 102, 0.2); transition: all 0.2s ease;">Join WhatsApp Group</a>
              </div>
              
              <p>If you have any questions, feel free to reply to this email or contact us through our social media channels.</p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; border-top: 1px solid #e5e7eb;">
              <!-- Social Media Icons -->
              <div style="margin-bottom: 20px;">
                <a href="https://www.instagram.com/websters.shivaji/" style="display: inline-block; margin: 0 10px; text-decoration: none;">
                  <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 24px; height: 24px;">
                </a>
                <a href="https://www.linkedin.com/company/websters-shivaji-college/" style="display: inline-block; margin: 0 10px; text-decoration: none;">
                  <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" style="width: 24px; height: 24px;">
                </a>
              </div>
              
              <p style="margin: 5px 0; font-size: 14px;">Best regards,</p>
              <p style="margin: 5px 0; font-weight: 600; font-size: 16px; color: #4f46e5;">Websters - Computer Science Society</p>
              <p style="margin: 5px 0; font-size: 14px;">Shivaji College, University of Delhi</p>
              <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">© 2025 Websters. All rights reserved.</p>
            </div>
          </div>
        </div>
      `
  }
};

export default workshopData;