import { NextRequest } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

function formatTime(timeStr: string) {
  const slots: Record<string, string> = {
    '09:00:00': '09:00 AM',
    '10:30:00': '10:30 AM',
    '12:00:00': '12:00 PM',
    '14:00:00': '02:00 PM',
    '15:30:00': '03:30 PM',
    '17:00:00': '05:00 PM',
  }
  return slots[timeStr] || timeStr
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getEmailHtml(
  clientName: string,
  date: string,
  time: string,
  type: 'confirmation' | 'cancellation' | 'reschedule'
) {
  const formattedDate = formatDate(date)
  const formattedTime = formatTime(time)

  let title = ''
  let heroColor = '#12261E'
  let message = ''
  let statusText = ''
  let actionText = ''

  if (type === 'confirmation') {
    title = 'Booking Confirmed'
    heroColor = '#162E24' // Deep Green
    message = `Thank you for scheduling a consultation with Maaz Enterprise. We look forward to working with you. Below are the details of your upcoming appointment:`
    statusText = 'Confirmed'
    actionText = 'If you need to reschedule or make changes, you can manage your bookings directly from your dashboard.'
  } else if (type === 'reschedule') {
    title = 'Booking Rescheduled'
    heroColor = '#D96B43' // Warm Orange
    message = `Your consultation booking has been successfully rescheduled. Please review the updated details below:`
    statusText = 'Rescheduled'
    actionText = 'If you have any questions or did not authorize this change, please contact our support team immediately.'
  } else {
    title = 'Booking Cancelled'
    heroColor = '#8A2525' // Crimson Red
    message = `This email confirms that your scheduled consultation booking has been cancelled. Below are the details of the cancelled booking:`
    statusText = 'Cancelled'
    actionText = 'If you would like to book a new appointment, you can do so by visiting our website.'
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f7fafc;
            color: #2d3748;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            margin-top: 40px;
            margin-bottom: 40px;
            border: 1px solid #e2e8f0;
          }
          .header {
            background-color: ${heroColor};
            padding: 40px 20px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.025em;
            text-transform: lowercase;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            color: #e2e8f0;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 16px;
            color: #1a202c;
          }
          .intro {
            font-size: 15px;
            line-height: 1.6;
            color: #4a5568;
            margin-bottom: 30px;
          }
          .details-card {
            background-color: #f8fafc;
            border: 1px solid #edf2f7;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 30px;
          }
          .details-row {
            display: flex;
            margin-bottom: 12px;
            border-bottom: 1px solid #edf2f7;
            padding-bottom: 12px;
          }
          .details-row:last-child {
            margin-bottom: 0;
            border-bottom: none;
            padding-bottom: 0;
          }
          .details-label {
            width: 120px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #718096;
            font-weight: 700;
          }
          .details-value {
            flex: 1;
            font-size: 15px;
            font-weight: 600;
            color: #1a202c;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            background-color: ${type === 'cancellation' ? '#FED7D7' : type === 'reschedule' ? '#FEFCBF' : '#C6F6D5'};
            color: ${type === 'cancellation' ? '#C53030' : type === 'reschedule' ? '#B7791F' : '#22543D'};
          }
          .action-info {
            font-size: 14px;
            line-height: 1.6;
            color: #718096;
            border-top: 1px solid #e2e8f0;
            padding-top: 24px;
            margin-top: 24px;
            text-align: center;
          }
          .btn-container {
            text-align: center;
            margin-top: 24px;
          }
          .btn {
            display: inline-block;
            background-color: #D96B43;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            box-shadow: 0 4px 6px rgba(217, 107, 67, 0.2);
          }
          .footer {
            text-align: center;
            padding: 30px 20px;
            font-size: 12px;
            color: #a0aec0;
            line-height: 1.5;
            background-color: #f7fafc;
            border-top: 1px solid #edf2f7;
          }
          .footer a {
            color: #718096;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p>Maaz Enterprise</p>
            <h1>${title}</h1>
          </div>
          <div class="content">
            <div class="greeting">Hello ${clientName},</div>
            <div class="intro">${message}</div>
            
            <div class="details-card">
              <div class="details-row">
                <div class="details-label">Date</div>
                <div class="details-value">${formattedDate}</div>
              </div>
              <div class="details-row">
                <div class="details-label">Time</div>
                <div class="details-value">${formattedTime}</div>
              </div>
              <div class="details-row">
                <div class="details-label">Status</div>
                <div class="details-value">
                  <span class="status-badge">${statusText}</span>
                </div>
              </div>
            </div>

            ${
              type !== 'cancellation'
                ? `
            <div class="btn-container">
              <a href="https://maazenterprise.space/dashboard" class="btn" target="_blank">View Dashboard</a>
            </div>
            `
                : ''
            }

            <div class="action-info">
              ${actionText}
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Maaz Enterprise. All rights reserved.</p>
            <p>Mumbai, India | Support: <a href="mailto:maazenterprisemum@gmail.com">maazenterprisemum@gmail.com</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}

export async function POST(request: Request) {
  try {
    const { clientName, clientEmail, date, time, type } = await request.json()

    // Validate required fields
    if (!clientName || !clientEmail || !date || !time || !type) {
      return Response.json(
        { error: 'Missing required booking details in body' },
        { status: 400 }
      )
    }

    if (!['confirmation', 'cancellation', 'reschedule'].includes(type)) {
      return Response.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      )
    }

    // Determine subject
    let subject = ''
    if (type === 'confirmation') {
      subject = 'Booking Confirmed: Your Consultation with Maaz Enterprise'
    } else if (type === 'reschedule') {
      subject = 'Booking Rescheduled: Your Consultation with Maaz Enterprise'
    } else {
      subject = 'Booking Cancelled: Consultation at Maaz Enterprise'
    }

    const htmlContent = getEmailHtml(clientName, date, time, type)

    const response = await resend.emails.send({
      from: 'bookings@maazenterprise.space',
      to: clientEmail,
      subject: subject,
      html: htmlContent,
    })

    if (response.error) {
      console.error('Resend API error:', response.error)
      return Response.json(
        { error: 'Resend API failed to send email', details: response.error },
        { status: 500 }
      )
    }

    return Response.json({ success: true, data: response.data })
  } catch (error: any) {
    console.error('Error sending transactional email:', error)
    return Response.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
