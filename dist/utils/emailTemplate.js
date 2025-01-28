export const generateResetPasswordEmail = (user, url) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="text-align: center; color: #333; font-size: 24px;">Password Reset Request</h2>
          <p style="font-size: 16px; color: #555;">Hi ${user.name},</p>
          <p style="font-size: 16px; color: #555;">We received a request to reset your password. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${url}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px;">Reset Password</a>
          </div>
          <p style="font-size: 16px; color: #555;">If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
          <p style="font-size: 16px; color: #555;">Thanks,<br>The InvoiceGennie Team</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">If you're having trouble clicking the "Reset Password" button, copy and paste the URL below into your web browser:</p>
          <p style="font-size: 12px; color: #777;">${url}</p>
        </div>
      `;
};
