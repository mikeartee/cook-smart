# Architecture Decision: AWS Lambda (Serverless)

## Decision Date
November 14, 2024

## Context
User has AWS account with:
- $112 in credits (expires in ~6 months)
- Always-free services (Lambda, DynamoDB, S3, API Gateway)
- Goal: Minimize costs during BETA and beyond
- Need: Downloadable app (not marketplace) via Firebase App Distribution

## Decision
Use **AWS Lambda + API Gateway** instead of EC2 + Express for the backend.

## Rationale

### Cost Comparison

**Lambda Approach (Chosen):**
- Lambda: FREE forever (1M requests/month)
- API Gateway: FREE forever (1M calls/month)
- RDS PostgreSQL: FREE for 7 months (credits), then $15/month
- S3: FREE forever (5GB)
- **Total: $0 for 7 months, then $15/month**

**EC2 Approach (Original Plan):**
- EC2 t2.micro: $8/month (from credits)
- RDS t3.micro: $15/month (from credits)
- **Total: $23/month from credits = ~5 months, then $23/month out of pocket**

### Benefits of Lambda

1. **Cost**: Free forever for backend compute
2. **Scalability**: Auto-scales from 1 to 1000 users
3. **Maintenance**: No server management
4. **Deployment**: Simpler than EC2
5. **Development**: Faster iteration

### Trade-offs

**Lambda Limitations:**
- 15-minute timeout (not an issue for our API calls)
- Cold starts (~1 second first request)
- Stateless (fine for REST API)

**Mitigation:**
- Keep functions warm with scheduled pings
- Use connection pooling for database
- Cache frequently accessed data

## Implementation Approach

### Backend Structure
```
backend/
├── functions/           # Lambda function handlers
│   ├── auth/
│   │   ├── register.ts
│   │   ├── login.ts
│   │   └── me.ts
│   ├── users/
│   │   ├── profile.ts
│   │   ├── updateProfile.ts
│   │   └── deleteAccount.ts
│   └── shared/
│       ├── db.ts        # Database connection pool
│       ├── auth.ts      # JWT middleware
│       └── utils.ts
├── migrations/          # Database migrations
└── serverless.yml       # Serverless Framework config
```

### Deployment
- Use Serverless Framework for deployment
- Single command: `serverless deploy`
- Automatic API Gateway setup
- Environment variables managed securely

### Database
- Keep RDS PostgreSQL (relational data model is better for our use case)
- Use connection pooling to handle Lambda's stateless nature
- Migrations run separately (not in Lambda)

## Consequences

### Positive
- Significantly lower costs
- Simpler deployment
- Better scalability
- Less maintenance

### Negative
- Different development pattern than Express
- Need to learn Serverless Framework basics
- Cold starts (minimal impact)

### Neutral
- Database stays the same (PostgreSQL)
- Frontend stays the same (React Native)
- Authentication logic stays the same (JWT)

## Status
**Accepted** - Proceeding with Lambda-based implementation
