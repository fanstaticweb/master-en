# Boutique Hotel / B&B Premium Website Template

A premium, modern, and highly conversion-oriented static website template for boutique hotels, guest houses, and Bed & Breakfasts.

Built using pure, lightweight vanilla technology (HTML5, CSS3, and modern JavaScript), this template is designed for lightning-fast loading speeds, responsiveness, and clean form automation.

## Project Structure
```
├── index.html        # Semantic HTML structural layouts with Netlify forms
├── styles.css        # Premium typography, layouts, transitions, and theme definitions
├── script.js         # Mobile navigation, sticky states, and Flatpickr calendar logic
└── README.md         # Deployment and customization guide (this file)
```

---

## 1. Quick Customization (CSS Variables)
The entire visual style of the website is controlled via CSS variables (Custom Properties) declared at the `:root` level of `styles.css`. You can customize the brand palette, typography, and border radius in seconds:

Open [styles.css](file:///styles.css) and edit the following variables:
```css
:root {
  /* Brand Colors */
  --primary-color: #b89047;       /* Refined Gold / Brass Accent */
  --primary-hover: #a37d39;       /* Darker gold for hover states */
  --primary-light: #f7f2e8;       /* Very light gold wash for focus/backgrounds */

  /* Base Neutral Colors */
  --bg-color: #faf8f5;            /* Sand / Warm Off-white */
  --bg-secondary: #f4efea;        /* Soft warm gray-sand */
  --bg-card: #ffffff;             /* Pure white for content cards */
  --text-color: #1a1d1a;          /* Charcoal Black for high contrast body text */
  --text-secondary: #5e645e;      /* Muted charcoal for descriptions */

  /* Structural Colors */
  --border-color: #e5dfd8;        /* Delicate warm border */
  --border-focus: #b89047;        /* Form input active focus color */
  --error-color: #c94b4b;         /* Soft red for invalid form states */

  /* Typography */
  --font-serif: 'Cormorant Garamond', Georgia, serif; /* Primary Headings */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif; /* Body Copy */

  /* Layout & Spacing */
  --border-radius: 4px;           /* Radius for cards, buttons, and inputs */
}
```

---

## 2. Replacing Client Data (HTML Placeholders)
The HTML file has comments indicating exactly where to replace placeholders with client details. Search for `INSERT` inside [index.html](file:///index.html) to locate these hooks:

- `<!-- INSERT LOGO HERE -->`: Brand logo or name (located in the header navigation and the footer).
- `<!-- INSERT HERO BACKGROUND IMAGE HERE -->`: Hero section backdrop (recommended size: `1920x1080px`).
- `<!-- INSERT HERO SUBTITLE / LOGLINE HERE -->` and `<!-- INSERT HERO HEADLINE HERE -->`.
- `<!-- INSERT ABOUT LEAD TEXT HERE -->` and `<!-- INSERT ABOUT BODY TEXT HERE -->`.
- `<!-- INSERT ABOUT IMAGE HERE -->`: Vertical orientation welcome image (recommended size: `800x1000px`).
- `<!-- INSERT ROOM [1/2/3] IMAGE HERE -->` and room title/pricing/amenities descriptions (recommended card image size: `600x450px`).
- `<!-- INSERT AMENITY [1/2/3/4] TITLE & DESC HERE -->`: Customize included guest services.
- `<!-- INSERT CONTACT ADDRESS, PHONE, EMAIL HERE -->` in the footer.

---

## 3. Netlify Forms Integration
This template features built-in form capture configured for Netlify Forms. There is zero backend setup required.

### Form Configuration
Both forms contain the necessary HTML properties:
1. **Hero Booking Bar** (`name="hero-booking"`)
2. **Detailed Reservation Form** (`name="detailed-inquiry"`)

Each form uses `data-netlify="true"`, `method="POST"`, and standard, descriptive `name` parameters on every input tag.

### Payload Fields
All inputs are named to produce structured, clean payloads:
- `full_name`: Guest's name (e.g. `"John Doe"`)
- `client_email`: Contact email address
- `client_phone`: Contact telephone number
- `room_type`: Selected suite code (`"deluxe_suite"`, `"orchard_cottage"`, `"timber_loft"`)
- `check_in_date`: Check-in date in `"YYYY-MM-DD"` format
- `check_out_date`: Check-out date in `"YYYY-MM-DD"` format
- `guest_count`: Count of guests (`"1"`, `"2"`, `"3"`, `"4"`, `"5+"`)
- `special_requests`: Special requests/preferences text block

### Routing Submissions to Google Sheets / CRM
When you deploy this project to Netlify, form submissions are saved in the Netlify Dashboard. You can automatically sync these to a Google Sheet, Zapier, or a webhook:
1. Go to your Netlify site panel: **Site Settings > Notifications > Form submissions**.
2. Click **Add integration**.
3. Choose **Webhook** or select **Zapier** / **Make** to trigger an automated flow.
4. Set the trigger to fire when a submission is received on either `detailed-inquiry` or `hero-booking`. Because of standardized inputs, the webhook payloads map cleanly to sheets.

---

## 4. Advanced Calendar Functionality
The datepickers use **Flatpickr**, a lightweight datepicker library, initialized in `script.js`.

### Logic Restrictions
1. **Past Dates Disabled**: The calendar restricts selections to `minDate: "today"`, preventing invalid past date bookings.
2. **Minimum 1-Night Stay & Order Enforcement**:
   - Choosing a check-in date automatically updates the check-out datepicker's `minDate` to **Check-in Date + 1 day**.
   - If the current selected check-out date is empty, or is before/equal to the new check-in date, the system auto-populates it with the next day and auto-opens the check-out calendar to speed up the guest's progress.

### Visual styling
The Flatpickr theme is overwritten in `styles.css` under the `#12. FLATPICKR CALENDAR THEME CUSTOMIZATION` section. The styling overrides all default background gradients and states, aligning the selection states, font families, and borders with the minimalist hotel theme.

### Google apps script url
https://script.google.com/macros/s/AKfycbxyn6qA4XcsaDt_f0xseWmkuXSth7cZSxSmxk2tStuztWJbW5F7UkNgWvK-3BORYSJw/exec
