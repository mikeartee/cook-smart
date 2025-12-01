# Email Compliance Guide

**Last Updated:** November 30, 2025

## Overview

This document outlines email compliance requirements for Cook Smart, covering CAN-SPAM (US), CASL (Canada), and GDPR (EU) regulations.

---

## CAN-SPAM Act (United States)

### Requirements

All marketing emails must include:

1. **Accurate Header Information**
   - "From" name must identify Cook Smart
   - "Reply-to" must be a valid, monitored email address
   - Subject line must accurately reflect content

2. **Physical Address**
   - Include Cook Smart's physical mailing address in footer
   - Can be P.O. Box or street address

3. **Clear Identification**
   - Email must be clearly identified as an advertisement (if applicable)
   - Use clear language like "Promotional Email" or "Marketing Message"

4. **Opt-Out Mechanism**
   - Include clear, conspicuous unsubscribe link
   - Process opt-outs within 10 business days
   - Honor opt-out for at least 30 days
   - Don't charge fees or require login to unsubscribe

5. **Responsibility**
   - Monitor what others are doing on your behalf
   - Both sender and company can be held liable

### Email Template Requirements

```html
<!-- Footer must include -->
<footer>
  <p>Cook Smart</p>
  <p>[Physical Address]</p>
  <p>
    <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
    <a href="{{preferences_url}}">Email Preferences</a>
  </p>
</footer>
```

---

## CASL (Canada)

### Requirements

1. **Express Consent**
   - Obtain clear, explicit consent before sending
   - Keep records of consent (who, when, how)
   - Implied consent expires after 2 years

2. **Identification**
   - Clearly identify sender (Cook Smart)
   - Include contact information

3. **Unsubscribe Mechanism**
   - Provide easy, free unsubscribe method
   - Process within 10 business days
   - Valid for at least 60 days after sending

4. **Content Requirements**
   - Subject line must not be misleading
   - Content must relate to consent given

### Consent Language Example

```
☐ Yes, I want to receive recipes, cooking tips, and updates from Cook Smart.

By checking this box, you consent to receive commercial electronic messages 
from Cook Smart. You can unsubscribe at any time using the link in our emails.
```

---

## GDPR (European Union)

### Requirements

1. **Lawful Basis**
   - Consent: Clear, affirmative action required
   - Legitimate Interest: Must be documented and balanced
   - Contract: Necessary for service delivery

2. **Consent Requirements**
   - Must be freely given, specific, informed
   - Pre-ticked boxes not allowed
   - Easy to withdraw as it was to give

3. **Data Protection**
   - Secure storage of email addresses
   - Data minimization (only collect what's needed)
   - Right to access, rectify, delete

4. **Transparency**
   - Clear privacy notice at point of collection
   - Explain how data will be used
   - Identify email service provider

### GDPR-Compliant Signup Form

```html
<form>
  <input type="email" name="email" required />
  
  <label>
    <input type="checkbox" name="consent" required />
    I agree to receive marketing emails from Cook Smart. 
    I understand I can unsubscribe at any time.
  </label>
  
  <p class="privacy-notice">
    We'll use your email to send recipes and cooking tips. 
    See our <a href="/legal/privacy">Privacy Policy</a> for details.
  </p>
  
  <button type="submit">Subscribe</button>
</form>
```

---

## Email Types and Compliance

### 1. Transactional Emails (Exempt from most marketing rules)

**Examples:**
- Account creation confirmation
- Password reset
- Order confirmations
- Service notifications

**Requirements:**
- Must be primarily transactional
- Can't include marketing content
- Still need unsubscribe for account emails

### 2. Marketing Emails (Full compliance required)

**Examples:**
- Newsletter
- Recipe recommendations
- Promotional offers
- Feature announcements

**Requirements:**
- All CAN-SPAM, CASL, GDPR rules apply
- Require explicit consent
- Must have unsubscribe option

### 3. Relationship Emails (Partial exemption)

**Examples:**
- Product updates
- Service changes
- Policy updates

**Requirements:**
- Can send to existing customers
- Still need unsubscribe option
- Must be relevant to relationship

---

## Email Template Standards

### Required Footer Elements

```html
<footer style="margin-top: 40px; padding: 20px; background: #f5f5f5; font-size: 12px; color: #666;">
  <p><strong>Cook Smart</strong></p>
  <p>[Physical Address Line 1]</p>
  <p>[City, State ZIP]</p>
  
  <p style="margin-top: 15px;">
    You're receiving this email because you signed up for Cook Smart updates.
  </p>
  
  <p style="margin-top: 10px;">
    <a href="{{unsubscribe_url}}" style="color: #0066cc;">Unsubscribe</a> | 
    <a href="{{preferences_url}}" style="color: #0066cc;">Email Preferences</a> | 
    <a href="https://cooksmartapp.com/legal/privacy" style="color: #0066cc;">Privacy Policy</a>
  </p>
  
  <p style="margin-top: 10px; font-size: 11px;">
    © 2025 Cook Smart. All rights reserved.
  </p>
</footer>
```

### Unsubscribe Page Template

```html
<h1>Unsubscribe Confirmation</h1>

<p>You have been successfully unsubscribed from Cook Smart marketing emails.</p>

<p>You will no longer receive:</p>
<ul>
  <li>Weekly recipe newsletters</li>
  <li>Cooking tips and tricks</li>
  <li>Promotional offers</li>
</ul>

<p>You will still receive:</p>
<ul>
  <li>Account-related emails</li>
  <li>Important service updates</li>
  <li>Security notifications</li>
</ul>

<p>Changed your mind? <a href="/newsletter">Resubscribe here</a></p>
```

---

## Consent Management

### Tracking Requirements

For each subscriber, record:

```typescript
interface EmailConsent {
  email: string;
  consentDate: Date;
  consentMethod: 'signup_form' | 'checkout' | 'account_creation';
  ipAddress: string;
  userAgent: string;
  consentText: string; // Exact text they agreed to
  source: string; // Which page/form
  doubleOptIn: boolean;
  doubleOptInDate?: Date;
}
```

### Double Opt-In (Recommended)

1. User submits email
2. Send confirmation email
3. User clicks confirmation link
4. Subscription activated

**Benefits:**
- Stronger proof of consent
- Reduces spam complaints
- Better email deliverability
- GDPR-friendly

---

## Unsubscribe Process

### Implementation Checklist

- [ ] Unsubscribe link in every marketing email
- [ ] One-click unsubscribe (no login required)
- [ ] Confirmation page (don't require confirmation click)
- [ ] Process within 10 business days
- [ ] Update all systems (email provider, CRM, database)
- [ ] Don't send any more marketing emails
- [ ] Keep record of unsubscribe request

### Unsubscribe API Endpoint

```typescript
// POST /api/unsubscribe
interface UnsubscribeRequest {
  email: string;
  token: string; // Unique token from email link
  reason?: string; // Optional feedback
}

interface UnsubscribeResponse {
  success: boolean;
  message: string;
}
```

---

## Email Service Provider Configuration

### Resend Configuration

```typescript
// Ensure these settings in Resend:
const emailConfig = {
  fromName: 'Cook Smart',
  fromEmail: 'services.cooksmart@gmail.com',
  replyTo: 'services.cooksmart@gmail.com',
  
  // Required headers
  headers: {
    'List-Unsubscribe': '<mailto:services.cooksmart@gmail.com>, <https://cooksmartapp.com/unsubscribe?token={{token}}>',
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  },
  
  // Track unsubscribes
  trackUnsubscribes: true,
};
```

---

## Compliance Checklist

### Before Sending Any Marketing Email

- [ ] Recipient gave explicit consent
- [ ] Consent is documented and dated
- [ ] "From" name is accurate (Cook Smart)
- [ ] Subject line is not misleading
- [ ] Physical address in footer
- [ ] Unsubscribe link is present and working
- [ ] Unsubscribe link is easy to find
- [ ] Email content matches consent given
- [ ] Privacy policy link included
- [ ] Email preferences link included

### Monthly Audit

- [ ] Review unsubscribe rate (should be < 0.5%)
- [ ] Test unsubscribe process
- [ ] Verify all unsubscribes processed
- [ ] Check spam complaint rate (should be < 0.1%)
- [ ] Review consent records
- [ ] Update suppression list
- [ ] Verify email templates have required elements

---

## Penalties for Non-Compliance

### CAN-SPAM
- Up to $46,517 per violation
- Criminal penalties possible

### CASL
- Up to $10 million CAD per violation
- Individual liability possible

### GDPR
- Up to €20 million or 4% of global revenue
- Whichever is higher

---

## Best Practices

1. **Always Get Permission**
   - Never buy email lists
   - Don't add people without consent
   - Use double opt-in when possible

2. **Make Unsubscribing Easy**
   - One-click unsubscribe
   - No login required
   - Process immediately

3. **Be Transparent**
   - Clear about what they'll receive
   - How often they'll hear from you
   - Easy to find privacy policy

4. **Respect Preferences**
   - Honor unsubscribes immediately
   - Offer granular preferences
   - Don't re-add unsubscribed users

5. **Keep Records**
   - When and how consent was given
   - What they consented to
   - Unsubscribe requests
   - Email send logs

6. **Monitor Metrics**
   - Open rates
   - Click rates
   - Unsubscribe rates
   - Spam complaints
   - Bounce rates

7. **Regular Audits**
   - Review email templates monthly
   - Test unsubscribe process
   - Verify consent records
   - Check compliance with latest regulations

---

## Contact Information

**For Email Compliance Questions:**
- Email: services.cooksmart@gmail.com
- Privacy Officer: services.cooksmart@gmail.com

**For Unsubscribe Issues:**
- Email: services.cooksmart@gmail.com
- Support: services.cooksmart@gmail.com

---

## Resources

- [FTC CAN-SPAM Act](https://www.ftc.gov/tips-advice/business-center/guidance/can-spam-act-compliance-guide-business)
- [CRTC CASL](https://crtc.gc.ca/eng/com500/faq500.htm)
- [GDPR Email Marketing](https://gdpr.eu/email-marketing/)
- [Resend Documentation](https://resend.com/docs)

---

**Last Review:** November 30, 2025  
**Next Review:** February 28, 2026  
**Owner:** Legal & Compliance Team
