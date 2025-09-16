# 🛡️ Manual Security Testing Guide

This guide provides step-by-step instructions to manually test all security features implemented in the ecommerce backend.

## 📋 Prerequisites

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Ensure Redis is running:**
   ```bash
   redis-server
   ```

3. **Have a terminal/command prompt ready for curl commands**

## 🧪 Test Cases

### **1. Input Validation Tests**

#### **Test 1.1: Valid Registration (Should Succeed)**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected Result:** `201 Created` with user data

#### **Test 1.2: Invalid Username (Should Fail)**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected Result:** `400 Bad Request` with username validation errors

#### **Test 1.3: Invalid Email (Should Fail)**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser456",
    "email": "invalid-email",
    "password": "SecurePass123!"
  }'
```
**Expected Result:** `400 Bad Request` with email validation errors

#### **Test 1.4: Invalid Password (Should Fail)**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser789",
    "email": "test789@example.com",
    "password": "weak"
  }'
```
**Expected Result:** `400 Bad Request` with password validation errors

### **2. XSS Protection Tests**

#### **Test 2.1: Script Tag in Username**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "<script>alert(\"XSS\")</script>",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected Result:** `400 Bad Request` - XSS content should be rejected

#### **Test 2.2: HTML Entities in Email**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser999",
    "email": "test<script>alert(\"XSS\")</script>@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected Result:** `400 Bad Request` - XSS content should be rejected

### **3. SQL Injection Protection Tests**

#### **Test 3.1: SQL Injection in Search Query**
```bash
curl -X GET "http://localhost:4000/api/v1/products/search?search='; DROP TABLE products; --"
```
**Expected Result:** `400 Bad Request` - SQL injection should be blocked

#### **Test 3.2: SQL Injection in Product ID**
```bash
curl -X GET "http://localhost:4000/api/v1/products/1'; DROP TABLE products; --"
```
**Expected Result:** `400 Bad Request` - SQL injection should be blocked

### **4. Rate Limiting Tests**

#### **Test 4.1: Auth Rate Limiting**
```bash
# Run this command 6 times quickly
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:4000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"usernameOrEmail": "test@example.com", "password": "wrongpassword"}'
  echo -e "\n"
done
```
**Expected Result:** 6th request should return `429 Too Many Requests`

#### **Test 4.2: General Rate Limiting**
```bash
# Run this command 11 times quickly
for i in {1..11}; do
  echo "Request $i:"
  curl -X GET "http://localhost:4000/api/v1/products"
  echo -e "\n"
done
```
**Expected Result:** 11th request should return `429 Too Many Requests`

### **5. Security Headers Tests**

#### **Test 5.1: Check Security Headers**
```bash
curl -I http://localhost:4000/api/v1/products
```
**Expected Headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: default-src 'self'...`
- `Referrer-Policy: strict-origin-when-cross-origin`

### **6. Request Size Limit Tests**

#### **Test 6.1: Large Payload**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser888",
    "email": "test888@example.com",
    "password": "SecurePass123!",
    "largeField": "'$(python -c "print('x' * 10000)")'"
  }'
```
**Expected Result:** `413 Payload Too Large`

### **7. File Upload Security Tests**

#### **Test 7.1: Valid Image Upload**
```bash
curl -X POST http://localhost:4000/api/v1/products/upload \
  -F "file=@test-image.jpg" \
  -F "productId=1"
```
**Expected Result:** `200 OK` with file information

#### **Test 7.2: Invalid File Type**
```bash
curl -X POST http://localhost:4000/api/v1/products/upload \
  -F "file=@malicious-script.js" \
  -F "productId=1"
```
**Expected Result:** `400 Bad Request` - Invalid file type should be rejected

### **8. Error Handling Tests**

#### **Test 8.1: Non-existent Route**
```bash
curl -X GET http://localhost:4000/non-existent-route
```
**Expected Result:** `404 Not Found` with generic error message (no stack trace)

#### **Test 8.2: Invalid JSON**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@example.com", "password": "SecurePass123!"'
```
**Expected Result:** `400 Bad Request` with generic error message

### **9. Authentication & Authorization Tests**

#### **Test 9.1: Protected Route Without Token**
```bash
curl -X GET http://localhost:4000/api/v1/products
```
**Expected Result:** `401 Unauthorized`

#### **Test 9.2: Protected Route With Valid Token**
```bash
# First, get a token by logging in
TOKEN=$(curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail": "test@example.com", "password": "SecurePass123!"}' | jq -r '.token')

# Then use the token
curl -X GET http://localhost:4000/api/v1/products \
  -H "Authorization: Bearer $TOKEN"
```
**Expected Result:** `200 OK` with products data

### **10. CSRF Protection Tests**

#### **Test 10.1: Missing CSRF Token**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser777",
    "email": "test777@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected Result:** `201 Created` (CSRF might not be fully implemented)

## 📊 Expected Results Summary

| Test Category | Expected Behavior |
|---------------|-------------------|
| Input Validation | Reject invalid data with specific error messages |
| XSS Protection | Block script tags and malicious content |
| SQL Injection | Block SQL injection attempts |
| Rate Limiting | Limit requests per IP/time window |
| Security Headers | Present security headers in responses |
| Request Size | Reject oversized requests |
| File Upload | Validate file types and sizes |
| Error Handling | Generic error messages, no stack traces |
| Authentication | Require valid tokens for protected routes |
| CSRF Protection | Validate CSRF tokens (if implemented) |

## 🚨 Troubleshooting

### **Common Issues:**

1. **Rate Limiting Too Aggressive:**
   - Wait 1 minute between test runs
   - Use different IP addresses in headers

2. **Validation Not Working:**
   - Check if server is running
   - Verify Redis is running
   - Check server logs for errors

3. **Tests Failing:**
   - Review the specific error messages
   - Check if all dependencies are installed
   - Verify the security middleware is properly configured

## 🎯 Success Criteria

Your security implementation is working correctly if:
- ✅ Invalid input is rejected with specific validation errors
- ✅ XSS attempts are blocked
- ✅ SQL injection attempts are blocked
- ✅ Rate limiting prevents abuse
- ✅ Security headers are present
- ✅ Large requests are rejected
- ✅ File uploads are validated
- ✅ Error messages don't expose sensitive information
- ✅ Protected routes require authentication
