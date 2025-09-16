# Security Testing Guide

## 🚀 **Prerequisites Setup**

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create `.env` file with:
```bash
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=ecommerce_poc
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
```

### 3. Start Services
```bash
# Start Redis
redis-server

# Start PostgreSQL
# (Your PostgreSQL setup)

# Start the application
npm run dev
```

## 🔍 **Security Testing Checklist**

### **1. Input Validation Testing**

#### **A. User Registration Validation**
```bash
# Test 1: Valid registration
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Test 2: Invalid email format
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "invalid-email",
    "password": "SecurePass123!"
  }'

# Test 3: Weak password
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "123"
  }'

# Test 4: XSS attempt in username
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "<script>alert(\"XSS\")</script>",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

#### **B. Product Creation Validation**
```bash
# Test 1: Valid product
curl -X POST http://localhost:4000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Product",
    "price": 99.99,
    "description": "A test product"
  }'

# Test 2: Invalid price (negative)
curl -X POST http://localhost:4000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Product",
    "price": -50.00
  }'

# Test 3: XSS in product name
curl -X POST http://localhost:4000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "<img src=x onerror=alert(\"XSS\")>",
    "price": 99.99
  }'
```

### **2. SQL Injection Testing**

```bash
# Test 1: SQL injection in search
curl -X GET "http://localhost:4000/api/v1/products/search?search='; DROP TABLE products; --"

# Test 2: SQL injection in product name
curl -X POST http://localhost:4000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Product\"; DROP TABLE products; --",
    "price": 99.99
  }'

# Test 3: Union-based injection
curl -X GET "http://localhost:4000/api/v1/products/search?search=test' UNION SELECT password FROM users--"
```

### **3. XSS Protection Testing**

```bash
# Test 1: Script tag injection
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "<script>alert(\"XSS\")</script>"
  }'

# Test 2: Event handler injection
curl -X POST http://localhost:4000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Product",
    "description": "Product with <img src=x onerror=alert(\"XSS\")>",
    "price": 99.99
  }'

# Test 3: JavaScript protocol
curl -X POST http://localhost:4000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Product",
    "imageUrl": "javascript:alert(\"XSS\")",
    "price": 99.99
  }'
```

### **4. Rate Limiting Testing**

```bash
# Test 1: Auth endpoint rate limiting (should fail after 5 requests)
for i in {1..10}; do
  curl -X POST http://localhost:4000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "usernameOrEmail": "test@example.com",
      "password": "wrongpassword"
    }'
  echo "Request $i completed"
done

# Test 2: General API rate limiting
for i in {1..110}; do
  curl -X GET http://localhost:4000/api/v1/products
  echo "Request $i completed"
done
```

### **5. File Upload Security Testing**

```bash
# Test 1: Valid image upload
curl -X POST http://localhost:4000/api/v1/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "file": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "fileName": "test.png",
    "fileType": "image/png"
  }'

# Test 2: Malicious file upload
curl -X POST http://localhost:4000/api/v1/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "file": "UEsDBBQAAAAIAA==",
    "fileName": "malicious.exe",
    "fileType": "application/octet-stream"
  }'

# Test 3: Oversized file
curl -X POST http://localhost:4000/api/v1/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "file": "'$(head -c 15M /dev/zero | base64)'",
    "fileName": "huge.txt"
  }'
```

### **6. Authentication & Authorization Testing**

```bash
# Test 1: Access protected route without token
curl -X GET http://localhost:4000/api/v1/users/profile

# Test 2: Access admin route with user token
curl -X POST http://localhost:4000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -d '{
    "name": "Test Product",
    "price": 99.99
  }'

# Test 3: Invalid token
curl -X GET http://localhost:4000/api/v1/users/profile \
  -H "Authorization: Bearer invalid-token"
```

### **7. Request Size Limiting Testing**

```bash
# Test 1: Large JSON payload
curl -X POST http://localhost:4000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "'$(head -c 6M /dev/zero | tr '\0' 'a')'",
    "price": 99.99
  }'
```

### **8. Security Headers Testing**

```bash
# Test 1: Check security headers
curl -I http://localhost:4000/

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: default-src 'self'; ...
```

## 🔧 **Automated Testing Scripts**

### **Create Test Script**
```bash
# Create test script
cat > security_tests.sh << 'EOF'
#!/bin/bash

BASE_URL="http://localhost:4000"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Security Tests...${NC}"

# Test 1: Input Validation
echo -e "\n${YELLOW}Testing Input Validation...${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "<script>alert(\"XSS\")</script>", "email": "invalid-email", "password": "123"}')

if [ "$response" = "400" ]; then
  echo -e "${GREEN}✓ Input validation working${NC}"
else
  echo -e "${RED}✗ Input validation failed (Status: $response)${NC}"
fi

# Test 2: SQL Injection
echo -e "\n${YELLOW}Testing SQL Injection Protection...${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/v1/products/search?search='; DROP TABLE products; --")

if [ "$response" = "400" ]; then
  echo -e "${GREEN}✓ SQL injection protection working${NC}"
else
  echo -e "${RED}✗ SQL injection protection failed (Status: $response)${NC}"
fi

# Test 3: Rate Limiting
echo -e "\n${YELLOW}Testing Rate Limiting...${NC}"
for i in {1..6}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"usernameOrEmail": "test@example.com", "password": "wrongpassword"}')
  
  if [ "$i" -eq 6 ] && [ "$response" = "429" ]; then
    echo -e "${GREEN}✓ Rate limiting working${NC}"
    break
  elif [ "$i" -eq 6 ]; then
    echo -e "${RED}✗ Rate limiting failed (Status: $response)${NC}"
  fi
done

# Test 4: Security Headers
echo -e "\n${YELLOW}Testing Security Headers...${NC}"
headers=$(curl -s -I $BASE_URL/)
if echo "$headers" | grep -q "X-Content-Type-Options: nosniff"; then
  echo -e "${GREEN}✓ Security headers present${NC}"
else
  echo -e "${RED}✗ Security headers missing${NC}"
fi

echo -e "\n${YELLOW}Security tests completed!${NC}"
EOF

chmod +x security_tests.sh
```

### **Run Tests**
```bash
./security_tests.sh
```

## 📊 **Monitoring & Logging**

### **Check Security Logs**
```bash
# Monitor logs in real-time
tail -f logs/security.log

# Check for specific security events
grep "suspicious_request_detected" logs/security.log
grep "sql_injection_protection" logs/security.log
grep "rate_limit_exceeded" logs/security.log
```

### **Redis Monitoring**
```bash
# Check rate limiting keys
redis-cli keys "rate_limit:*"

# Check auth tokens
redis-cli keys "auth:*"
```

## 🛡️ **Expected Security Behaviors**

### **✅ What Should Work:**
1. **Input Validation**: All invalid inputs should return 400 status
2. **XSS Protection**: Script tags and dangerous content should be sanitized
3. **SQL Injection**: Malicious SQL patterns should be blocked
4. **Rate Limiting**: Excessive requests should return 429 status
5. **File Upload**: Only allowed file types should be accepted
6. **Authentication**: Protected routes should require valid JWT
7. **Authorization**: Admin routes should require admin role
8. **Security Headers**: All security headers should be present
9. **Error Handling**: No sensitive information in error responses

### **❌ What Should Fail:**
1. Invalid email formats
2. Weak passwords
3. SQL injection attempts
4. XSS payloads
5. Oversized requests
6. Malicious file uploads
7. Unauthorized access attempts
8. Rate limit violations

## 🔍 **Manual Testing Tools**

### **Using Postman:**
1. Import the API collection
2. Set up environment variables
3. Run the security test collection
4. Verify all tests pass

### **Using curl:**
```bash
# Test all endpoints systematically
curl -X GET http://localhost:4000/api/v1/products
curl -X POST http://localhost:4000/auth/register -d '{"username":"test","email":"test@test.com","password":"Test123!"}'
# ... continue with other tests
```

## 📈 **Performance Testing**

### **Load Testing with Apache Bench:**
```bash
# Test rate limiting
ab -n 100 -c 10 http://localhost:4000/api/v1/products

# Test with authentication
ab -n 50 -c 5 -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:4000/api/v1/users/profile
```

## 🚨 **Security Incident Response**

If you detect security issues:

1. **Check logs** for attack patterns
2. **Verify rate limiting** is working
3. **Test input validation** on all endpoints
4. **Review error responses** for information leakage
5. **Monitor Redis** for rate limit violations
6. **Check database** for any unauthorized changes

## 📝 **Test Results Documentation**

Keep track of:
- Test execution date/time
- Test results (pass/fail)
- Any security issues found
- Performance impact measurements
- Recommendations for improvements

This comprehensive testing approach will help you verify that all security measures are working correctly and your application is protected against common vulnerabilities.
