function doGet(e) {
  return handleRead();
}

function doPost(e) {
  try {
    var parameter = e.parameter;
    if (e.postData && e.postData.contents) {
      try {
        parameter = JSON.parse(e.postData.contents);
      } catch (err) {}
    }
    
    var action = parameter.action || "insert";
    
    if (action === "read") {
      return handleRead();
    } else if (action === "update") {
      return handleUpdate(parameter);
    } else if (action === "email") {
      return handleSendEmail(parameter);
    } else {
      return handleInsert(parameter);
    }
  } catch (error) {
    return createJsonResponse({ result: "error", error: error.toString() });
  }
}

// Helper to create JSON response
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// 1. Read all bookings
function handleRead() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return createJsonResponse([]);
  }
  
  var bookings = [];
  // Row 0 is the headers, rest are bookings
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    
    // Skip empty rows
    if (!row[0]) continue;
    
    bookings.push({
      timestamp: row[0] instanceof Date ? row[0].toISOString() : row[0].toString(),
      fullName: row[1],
      email: row[2],
      phone: row[3],
      room: row[4],
      checkIn: row[5] instanceof Date ? row[5].toISOString().split('T')[0] : row[5],
      checkOut: row[6] instanceof Date ? row[6].toISOString().split('T')[0] : row[6],
      guests: row[7],
      requests: row[8],
      status: row[9] || "Pending"
    });
  }
  
  return createJsonResponse(bookings);
}

// 2. Insert new booking (from customer form)
function handleInsert(parameter) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var timestamp = new Date();
  var fullName = parameter.full_name || "";
  var email = parameter.client_email || "";
  var phone = parameter.client_phone || "";
  var room = parameter.room_type || "";
  var checkIn = parameter.check_in_date || "";
  var checkOut = parameter.check_out_date || "";
  var guests = parameter.guest_count || "";
  var requests = parameter.special_requests || "";
  var status = "Pending";
  
  var roomMap = {
    "deluxe_suite": "Deluxe Ocean Suite",
    "orchard_cottage": "Orchard Cottage",
    "timber_loft": "Timber Loft"
  };
  if (roomMap[room]) room = roomMap[room];
  
  sheet.appendRow([
    timestamp,
    fullName,
    email,
    phone,
    room,
    checkIn,
    checkOut,
    guests,
    requests,
    status
  ]);
  
  // Send summary email to guest
  if (email) {
    try {
      var subject = "Your Booking Inquiry Summary - The Haven";
      var bodyHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="font-family: 'Playfair Display', serif; color: #1c2d37; border-bottom: 2px solid #c5a880; padding-bottom: 10px;">The Haven</h2>
          <p>Dear ${fullName},</p>
          <p>Thank you for submitting your booking inquiry. We have received your request and below is a summary of the details we received:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold; width: 150px;">Selected Room</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${room}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Check-in Date</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${checkIn}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Check-out Date</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${checkOut}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Total Guests</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${guests}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Phone Number</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${phone}</td>
            </tr>
            ${requests ? `
            <tr>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Special Requests</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; font-style: italic;">${requests}</td>
            </tr>
            ` : ''}
          </table>
          
          <div style="background-color: #fff3e0; border-left: 4px solid #ef6c00; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong style="color: #ef6c00; display: block; margin-bottom: 5px;">Important Notice:</strong>
            <span style="font-size: 14px; line-height: 1.4; color: #222222;">
              This email is a summary of your inquiry and <strong>does NOT constitute a final booking confirmation</strong>. 
              To finalize and secure your reservation, please wait for our staff to review your request and contact you shortly.
            </span>
          </div>
          
          <p style="margin-top: 30px; font-size: 13px; color: #666666;">
            Warm regards,<br>
            <strong>The Haven Team</strong>
          </p>
        </div>
      `;
      
      MailApp.sendEmail({
        to: email,
        subject: subject,
        htmlBody: bodyHtml
      });
    } catch (mailError) {
      Logger.log("Failed to send email: " + mailError.toString());
    }
  }
  
  return createJsonResponse({ result: "success" });
}

// 3. Update existing booking (from admin panel)
function handleUpdate(parameter) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (!parameter.timestamp) {
    return createJsonResponse({ result: "error", error: "Missing timestamp identifier" });
  }
  
  var targetTime = new Date(parameter.timestamp).getTime();
  var foundRowIndex = -1;
  
  // Find the row matching the timestamp
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    var rowTime = new Date(data[i][0]).getTime();
    
    // Check if timestamp is within a 2-second tolerance window to avoid timezone/format differences
    if (Math.abs(rowTime - targetTime) < 2000) {
      foundRowIndex = i + 1; // Spreadsheet is 1-indexed, headers are row 1
      break;
    }
  }
  
  if (foundRowIndex === -1) {
    return createJsonResponse({ result: "error", error: "Booking not found with timestamp: " + parameter.timestamp });
  }
  
  // Columns order: 1: Timestamp, 2: Full Name, 3: Email, 4: Phone, 5: Room, 6: Check-in, 7: Check-out, 8: Guests, 9: Requests, 10: Status
  if (parameter.fullName !== undefined) sheet.getRange(foundRowIndex, 2).setValue(parameter.fullName);
  if (parameter.email !== undefined) sheet.getRange(foundRowIndex, 3).setValue(parameter.email);
  if (parameter.phone !== undefined) sheet.getRange(foundRowIndex, 4).setValue(parameter.phone);
  if (parameter.room !== undefined) sheet.getRange(foundRowIndex, 5).setValue(parameter.room);
  if (parameter.checkIn !== undefined) sheet.getRange(foundRowIndex, 6).setValue(parameter.checkIn);
  if (parameter.checkOut !== undefined) sheet.getRange(foundRowIndex, 7).setValue(parameter.checkOut);
  if (parameter.guests !== undefined) sheet.getRange(foundRowIndex, 8).setValue(parameter.guests);
  if (parameter.requests !== undefined) sheet.getRange(foundRowIndex, 9).setValue(parameter.requests);
  if (parameter.status !== undefined) sheet.getRange(foundRowIndex, 10).setValue(parameter.status);
  
  return createJsonResponse({ result: "success" });
}

// 4. Send email to guest from admin panel
function handleSendEmail(parameter) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (!parameter.timestamp) {
    return createJsonResponse({ result: "error", error: "Missing timestamp identifier" });
  }
  
  var targetTime = new Date(parameter.timestamp).getTime();
  var foundRowIndex = -1;
  
  // Find the row matching the timestamp
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    var rowTime = new Date(data[i][0]).getTime();
    
    if (Math.abs(rowTime - targetTime) < 2000) {
      foundRowIndex = i + 1; // Spreadsheet is 1-indexed, headers are row 1
      break;
    }
  }
  
  if (foundRowIndex === -1) {
    return createJsonResponse({ result: "error", error: "Booking not found with timestamp: " + parameter.timestamp });
  }
  
  var row = data[foundRowIndex - 1];
  var fullName = row[1];
  var email = row[2];
  var phone = row[3];
  var room = row[4];
  var checkIn = row[5] instanceof Date ? row[5].toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : row[5];
  var checkOut = row[6] instanceof Date ? row[6].toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : row[6];
  var guests = row[7];
  var requests = row[8];
  
  var template = parameter.template || "confirm";
  var subject = "";
  var bodyHtml = "";
  
  if (template === "confirm") {
    subject = "Booking Confirmed - The Haven";
    bodyHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="font-family: 'Playfair Display', serif; color: #1c2d37; border-bottom: 2px solid #c5a880; padding-bottom: 10px;">The Haven</h2>
        <p>Dear ${fullName},</p>
        <p>We are delighted to confirm your reservation at The Haven! Your booking has been approved, and we look forward to welcoming you soon. Below is a summary of your confirmed stay:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold; width: 150px;">Selected Room</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${room}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Check-in Date</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${checkIn}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Check-out Date</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${checkOut}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Total Guests</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${guests}</td>
          </tr>
          ${requests ? `
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold;">Special Requests</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0; font-style: italic;">${requests}</td>
          </tr>
          ` : ''}
        </table>
        
        <p>Check-in is available from 3:00 PM, and check-out is by 11:00 AM. If you have any questions or require assistance with airport transfers or local recommendations, please reply directly to this email.</p>
        
        <p style="margin-top: 30px; font-size: 13px; color: #666666;">
          Warm regards,<br>
          <strong>The Haven Team</strong>
        </p>
      </div>
    `;
  } else if (template === "unavailable") {
    subject = "Update regarding your booking request - The Haven";
    bodyHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="font-family: 'Playfair Display', serif; color: #1c2d37; border-bottom: 2px solid #c5a880; padding-bottom: 10px;">The Haven</h2>
        <p>Dear ${fullName},</p>
        <p>Thank you for your interest in staying at The Haven. We have received your booking inquiry for the <strong>${room}</strong> from <strong>${checkIn}</strong> to <strong>${checkOut}</strong>.</p>
        
        <p>Unfortunately, due to high demand, the room is not available for the specific dates you selected. We sincerely apologize for any disappointment this may cause.</p>
        
        <div style="background-color: #f4f6f7; border-left: 4px solid #c5a880; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <span style="font-size: 14px; line-height: 1.4; color: #222222; display: block;">
            We would love the opportunity to host you! We politely suggest:
            <ul style="margin-top: 8px; margin-bottom: 0; padding-left: 20px;">
              <li>Adjusting your travel dates by a few days, or</li>
              <li>Checking the availability of our other premium room options.</li>
            </ul>
          </span>
        </div>
        
        <p>Please reply directly to this email to coordinate alternative arrangements, and our front desk will be happy to find the perfect solution for your stay.</p>
        
        <p style="margin-top: 30px; font-size: 13px; color: #666666;">
          Warm regards,<br>
          <strong>The Haven Team</strong>
        </p>
      </div>
    `;
  }
  
  if (email) {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: bodyHtml
    });
    
    // Automatically update status in sheet to Approved or Rejected
    var newStatus = (template === "confirm") ? "Approved" : "Rejected";
    sheet.getRange(foundRowIndex, 10).setValue(newStatus);
    
    return createJsonResponse({ result: "success", newStatus: newStatus });
  } else {
    return createJsonResponse({ result: "error", error: "Guest email is empty" });
  }
}
