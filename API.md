# API Documentation

## Endpoints

### GET /
Home page with chat interface

### POST /send_message
Send a message to the AI

**Request Body:**
```json
{
    "message": "string"
}
```

**Response:**
```json
{
    "response": "string"
}
```

### POST /analyze_image
Analyze an image using AI

**Request Body:**
```json
{
    "image": "base64_encoded_string"
}
```

**Response:**
```json
{
    "response": "string"
}
```

## Rate Limits
- Messages: 20 per minute
- Image Analysis: 10 per minute 