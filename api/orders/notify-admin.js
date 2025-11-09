const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orders, customer_info, transaction_hash, total_price_eth } = req.body;

    // Create email content
    const orderDetails = orders.map(order => 
      `- ${order.card.name} (Quantity: ${order.quantity}) - ${order.card.price_eth} ETH each`
    ).join('\n');

    const emailContent = `
New Order Received - PokePort Market

Customer Information:
- Name: ${customer_info.name}
- Email: ${customer_info.email}
- Phone: ${customer_info.phone || 'Not provided'}

Shipping Address:
${customer_info.address}
${customer_info.city ? customer_info.city + ', ' : ''}${customer_info.state || ''} ${customer_info.zipCode || ''}
${customer_info.country || ''}

Order Details:
${orderDetails}

Total: ${total_price_eth} ETH
Transaction Hash: ${transaction_hash}

Order IDs: ${orders.map(o => o.id).join(', ')}

Please process this order and update the status in the admin panel.
    `;

    // Configure email transporter (you'll need to set up SMTP credentials)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@pokeport.com',
      to: 'pokeportsales@gmail.com',
      subject: `New Order - ${customer_info.name} - ${total_price_eth} ETH`,
      text: emailContent
    });

    return res.status(200).json({ success: true, message: 'Admin notification sent' });
  } catch (error) {
    console.error('Email notification error:', error);
    // Don't fail the entire checkout if email fails
    return res.status(200).json({ success: false, message: 'Email notification failed but order was processed' });
  }
};