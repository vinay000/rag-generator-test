# API Architecture Guidelines

## Microservices and Gateway Design
Our API infrastructure is powered by an API Gateway built on top of Express and Envoy. All incoming traffic passes through the gateway for authentication, rate limiting, and request validation before being routed to downstream internal microservices.

### Rate Limiting Policies
- Standard tier users are limited to 100 requests per minute (RPM).
- Enterprise tier users are granted up to 5,000 requests per minute with dedicated burst capacity up to 10,000 RPM.
- When a client exceeds the quota, the gateway returns an HTTP `429 Too Many Requests` status code along with a `Retry-After` header indicating the cooldown period in seconds.

### Authentication and Tokens
- All private endpoints require a Bearer token in the `Authorization` header.
- Access tokens are signed JWTs with an expiration lifetime of 15 minutes.
- Refresh tokens are stored in secure HTTP-only cookies and remain valid for 30 days.
- Revocation of tokens is tracked in an in-memory Redis cluster with distributed TTLs.

### Caching Strategy
- Read-heavy endpoints use Redis for caching with a default Time-to-Live (TTL) of 300 seconds.
- Cache keys follow the strict pattern: `service:endpoint:hash(params)`.
- Write operations immediately emit invalidation events through Kafka topics to purge stale cache entries across all gateway nodes.
