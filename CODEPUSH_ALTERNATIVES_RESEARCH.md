# CodePush Alternatives - Detailed Research

**Date**: December 7, 2025
**Research Goal**: Find free or low-cost OTA update solutions that support React Native New Architecture

---

## Research Summary

### Key Findings
1. Microsoft CodePush retired March 31, 2025
2. Several alternatives emerged, but most are paid services
3. Need to verify which support New Architecture
4. Need to verify pricing and free tiers

---

## Alternative 1: Bitrise CodePush Beta

### What We Know
- **Status**: Beta (full launch 2026)
- **Company**: Bitrise (established CI/CD platform)
- **New Architecture**: Claims to support it
- **Pricing**: NOT YET ANNOUNCED

### What We Need to Find Out
- [ ] Is there a free tier for CodePush?
- [ ] Is CodePush separate from CI/CD pricing?
- [ ] Can we test beta without payment?
- [ ] What are the usage limits?
- [ ] When will pricing be announced?

### Where to Look
- Bitrise website: https://bitrise.io
- Bitrise documentation
- Bitrise blog/announcements
- Contact Bitrise support for beta access

### Initial Assessment
**Problem**: Bitrise's free "Hobby" plan is for CI/CD builds (building APKs), not OTA updates. CodePush pricing is separate and unknown.

**Risk**: Could be expensive when it exits beta.

---

## Alternative 2: Appcircle

### What We Know
- **Status**: Production ready
- **Company**: Appcircle (mobile DevOps platform)
- **New Architecture**: Claims to support RN 0.76+
- **Pricing**: Unknown

### What We Need to Find Out
- [ ] Pricing structure
- [ ] Free tier availability
- [ ] Usage limits
- [ ] Integration complexity
- [ ] Does it require their full platform?

### Where to Look
- Appcircle website: https://appcircle.io
- Appcircle pricing page
- Appcircle documentation
- Contact sales for pricing

### Initial Assessment
**Concern**: Likely requires their full DevOps platform subscription. Probably not free.

---

## Alternative 3: Self-Hosted CodePush Server

### What We Know
- **Status**: Open source (Microsoft released before retiring)
- **Cost**: Free software + hosting costs
- **New Architecture**: Requires modification
- **Effort**: HIGH

### Pros
- ✅ Free software
- ✅ Full control
- ✅ No vendor lock-in
- ✅ Can modify for New Architecture

### Cons
- ❌ High setup effort (DevOps expertise needed)
- ❌ Ongoing maintenance required
- ❌ Security responsibility
- ❌ Hosting costs (~$10-20/month AWS)
- ❌ Need to modify for New Architecture support

### Hosting Cost Estimate
- **AWS EC2 t3.micro**: ~$8/month
- **Database (RDS or self-hosted)**: ~$5-10/month
- **Storage (S3)**: ~$1-2/month
- **Total**: ~$15-20/month

### Effort Estimate
- **Initial setup**: 8-16 hours
- **New Architecture modification**: 4-8 hours
- **Testing**: 4-8 hours
- **Ongoing maintenance**: 2-4 hours/month
- **Total initial**: 16-32 hours

### Initial Assessment
**Verdict**: Technically fits budget ($15-20/month), but effort is too high for solo developer. Not recommended unless you have DevOps experience.

---

## Alternative 4: Expo Updates (EAS Update)

### What We Know
- **Status**: Production ready
- **Company**: Expo (React Native framework)
- **New Architecture**: Supports it
- **Pricing**: Has free tier!

### The Catch
**Requires Expo** - Your app is pure React Native (no Expo). Converting would be major refactoring.

### Conversion Effort
- **Eject from pure RN to Expo**: 8-16 hours
- **Test all features**: 4-8 hours
- **Fix compatibility issues**: Unknown (could be significant)
- **Risk**: High (could break working app)

### Pricing (EAS Update)
- **Free tier**: Yes! Limited updates
- **Paid tiers**: Start at $29/month

### Initial Assessment
**Verdict**: Not worth it. Converting to Expo is too risky and time-consuming. Your app works great as pure React Native.

---

## Alternative 5: Electrode Native (Walmart)

### What We Know
- **Status**: Open source
- **Company**: Walmart Labs
- **Features**: OTA updates + more
- **Complexity**: HIGH

### Initial Assessment
**Verdict**: Enterprise solution, overkill for your needs. Too complex.

---

## Alternative 6: React Native Hot Update (Community)

### What We Know
- **Status**: Community project
- **Cost**: Free
- **New Architecture**: Unknown
- **Maturity**: Unknown

### What We Need to Find Out
- [ ] Does it exist and is it maintained?
- [ ] New Architecture support?
- [ ] Documentation quality?
- [ ] Community size?

### Where to Look
- GitHub search: "react native hot update"
- npm search: "react-native-hot-update"
- Community forums

### Initial Assessment
**Concern**: Community projects can be abandoned. Need to verify it's actively maintained.

---

## Alternative 7: Wait for Free Alternative

### The Reality
OTA updates are valuable. Companies know this. Most will charge for it.

### Likelihood of Free Alternative
- **Short term (3-6 months)**: Low
- **Long term (1+ year)**: Medium
- **Community solution**: Possible but risky (maintenance)

### What Could Happen
1. Bitrise offers free tier (optimistic)
2. Another company launches free service (possible)
3. Community builds reliable free solution (unlikely)
4. You continue with manual APKs (realistic)

---

## Cost Comparison

| Solution | Setup Cost | Monthly Cost | Effort | Risk |
|----------|-----------|--------------|--------|------|
| Bitrise CodePush | $0 (beta) | Unknown | Low | Medium |
| Appcircle | $0 | Unknown (likely $50+) | Low | Medium |
| Self-Hosted | $0 | $15-20 | HIGH | High |
| Expo Updates | $0 | $0-29 | HIGH | High |
| Manual APKs | $0 | $0 | Low | None |

---

## Budget Reality Check

**Your budget**: $20/month emergency only

**What fits**:
- ✅ Self-hosted (~$15-20/month) - but effort too high
- ✅ Manual APKs ($0) - current solution
- ⚠️ Bitrise/Appcircle - unknown pricing
- ❌ Expo Updates - requires major refactoring

**Realistic options**:
1. Continue with manual APKs (free, works great)
2. Wait for Bitrise pricing announcement
3. Self-host if you gain DevOps skills

---

## Research Action Items

### Immediate Research (Can do now)
- [ ] Check Bitrise website for CodePush Beta signup
- [ ] Search Bitrise blog for CodePush announcements
- [ ] Check if Bitrise CodePush has documentation yet
- [ ] Search GitHub for "react-native-hot-update" alternatives
- [ ] Check npm for OTA update packages

### Contact Research (Requires outreach)
- [ ] Email Bitrise support about beta access
- [ ] Ask about free tier plans
- [ ] Request pricing timeline
- [ ] Check Appcircle pricing page
- [ ] Contact Appcircle sales for quote

### Community Research
- [ ] Search React Native discussions for alternatives
- [ ] Check Reddit r/reactnative for recommendations
- [ ] Look for blog posts about CodePush alternatives
- [ ] Check Stack Overflow for solutions

---

## Preliminary Recommendations

### Based on Current Information

**1st Choice: Wait for Bitrise Pricing**
- **Why**: Most promising option, but pricing unknown
- **Timeline**: Q1 2026
- **Action**: Set reminder to check monthly
- **Cost**: $0 (waiting is free)

**2nd Choice: Continue Manual APKs**
- **Why**: Works perfectly, zero cost, zero risk
- **Timeline**: Indefinite
- **Action**: Nothing (keep doing what works)
- **Cost**: $0

**3rd Choice: Self-Host (Only if desperate)**
- **Why**: Fits budget but requires expertise
- **Timeline**: 2-4 weeks setup
- **Action**: Learn DevOps, set up server
- **Cost**: ~$15-20/month + time

**Not Recommended**:
- ❌ Expo conversion (too risky)
- ❌ Appcircle (likely too expensive)
- ❌ Community solutions (too risky/unmaintained)

---

## Next Steps

### Option A: Quick Online Research (30 min)
Search for:
1. Bitrise CodePush Beta signup page
2. Bitrise CodePush documentation
3. Community discussions about alternatives
4. npm packages for OTA updates

**Outcome**: See if there's an obvious free solution we missed

### Option B: Contact Bitrise (1-2 days wait)
1. Email Bitrise support
2. Ask about beta access
3. Ask about free tier plans
4. Wait for response

**Outcome**: Get official information about pricing

### Option C: Accept Reality (0 min)
1. Acknowledge OTA updates cost money
2. Continue with manual APKs
3. Revisit when budget allows

**Outcome**: Save time, keep app stable

---

## Questions to Answer

### Critical Questions
1. **Does Bitrise CodePush have a free tier?**
   - Status: Unknown
   - Impact: High (determines if we can use it)

2. **When will Bitrise announce pricing?**
   - Status: Unknown (likely Q1 2026)
   - Impact: High (determines timeline)

3. **Are there any truly free alternatives?**
   - Status: Researching
   - Impact: High (could solve everything)

### Secondary Questions
4. **Is self-hosting realistic for solo developer?**
   - Answer: No (too much effort)
   - Impact: Medium

5. **Should we convert to Expo?**
   - Answer: No (too risky)
   - Impact: Low

6. **Can we build our own OTA system?**
   - Answer: Technically yes, but huge effort
   - Impact: Low (not practical)

---

## Realistic Expectations

### What's Likely to Happen
1. **Bitrise will charge** for CodePush (maybe $20-50/month)
2. **Appcircle will charge** (probably $50+/month)
3. **Free alternatives** will be limited or risky
4. **You'll continue with manual APKs** (and that's okay!)

### Why Manual APKs Are Fine
- ✅ Your app works perfectly
- ✅ Beta users can handle manual updates
- ✅ Most apps don't have OTA updates
- ✅ Zero cost, zero risk
- ✅ Can add OTA later when budget allows

### When OTA Updates Become Worth It
- When you have 1000+ active users
- When you need to fix critical bugs instantly
- When your budget increases
- When free tier becomes available
- When manual distribution becomes painful

**Current status**: ~10-50 beta users? Manual APKs are fine.

---

## Conclusion

**Reality**: OTA updates cost money now that Microsoft CodePush is dead.

**Your options**:
1. Wait for Bitrise pricing (Q1 2026)
2. Continue manual APKs (works great)
3. Self-host (too much effort)

**My recommendation**: Continue with manual APKs until:
- Bitrise announces free tier, OR
- Your budget increases, OR
- User base grows significantly

**Next action**: Quick online research (30 min) to see if we missed anything obvious, then make final decision.

---

**Status**: Research in progress

**Time invested**: 30 minutes (documentation)

**Next**: Quick online search for free alternatives

