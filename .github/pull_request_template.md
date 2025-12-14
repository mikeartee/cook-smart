# Pull Request

## 📋 Description

<!-- Provide a brief description of the changes in this PR -->

## 🔗 Related Issues

<!-- Link to any related issues using "Fixes #123" or "Closes #123" -->

## 🧪 Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Code style update (formatting, renaming)
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security improvement
- [ ] 🧪 Test update
- [ ] 🔧 Build/CI update

## 🧪 Testing

<!-- Describe the tests you ran and how to reproduce them -->

### Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

### Test Results
```bash
# Paste test results here
```

## 📱 Screenshots/Videos

<!-- If applicable, add screenshots or videos to demonstrate the changes -->

### Before
<!-- Screenshots/videos of the current behavior -->

### After
<!-- Screenshots/videos of the new behavior -->

## 🔍 Code Quality Checklist

### General
- [ ] Code follows the project's coding standards
- [ ] Self-review of code completed
- [ ] Code is properly commented
- [ ] No console.log statements left in production code
- [ ] No hardcoded values (use environment variables)

### TypeScript
- [ ] Proper type annotations added
- [ ] No `any` types used (unless absolutely necessary)
- [ ] Interfaces defined for object structures
- [ ] Generic types use meaningful names

### React Native
- [ ] Components are properly typed
- [ ] Hooks are used correctly
- [ ] Performance optimizations applied (useMemo, useCallback where needed)
- [ ] Accessibility props added where applicable

### Backend
- [ ] Input validation implemented
- [ ] Error handling added
- [ ] Database queries optimized
- [ ] API documentation updated

## 🔒 Security Checklist

- [ ] No sensitive data exposed in logs
- [ ] Input sanitization implemented
- [ ] Authentication/authorization checks in place
- [ ] SQL injection prevention measures applied
- [ ] XSS prevention measures applied

## 📚 Documentation

- [ ] README updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Inline code comments added
- [ ] CHANGELOG.md updated

## 🚀 Deployment

### Environment Variables
- [ ] New environment variables documented
- [ ] Environment variables added to staging/production

### Database Changes
- [ ] Database migrations created
- [ ] Migration tested on staging
- [ ] Rollback plan documented

### Breaking Changes
- [ ] Breaking changes documented
- [ ] Migration guide provided
- [ ] Stakeholders notified

## 📋 Reviewer Checklist

<!-- For reviewers to complete -->

### Code Review
- [ ] Code logic is sound
- [ ] Code follows project standards
- [ ] Performance implications considered
- [ ] Security implications reviewed

### Testing
- [ ] Tests are comprehensive
- [ ] Tests pass locally
- [ ] Manual testing completed

### Documentation
- [ ] Documentation is clear and complete
- [ ] API changes are documented
- [ ] Breaking changes are highlighted

## 🎯 Post-Merge Tasks

<!-- Tasks to complete after merging -->

- [ ] Deploy to staging environment
- [ ] Verify functionality in staging
- [ ] Update project board/issues
- [ ] Notify stakeholders of changes

## 📞 Additional Notes

<!-- Any additional information for reviewers -->

---

**By submitting this PR, I confirm that:**
- [ ] I have read and followed the contributing guidelines
- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my code
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes