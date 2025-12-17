# Chat App Backend

A real-time chat application backend built with Flask, Socket.IO, and MongoDB.

## Features

- Real-time messaging using WebSocket (Socket.IO)
- Message persistence with MongoDB
- REST API endpoints
- User presence tracking
- Typing indicators
- CORS enabled for frontend integration

## Setup

### Prerequisites

- Python 3.8+
- MongoDB installed and running locally

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update MongoDB URI if needed

3. Start MongoDB:
```bash
# Make sure MongoDB is running on localhost:27017
```

4. Run the server:
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### REST API

- `GET /` - API status and documentation
- `GET /api/messages` - Get all messages (last 100)
- `POST /api/messages` - Send a new message

### WebSocket Events

**Client → Server:**
- `connect` - Connect to the server
- `join` - Join the chat with a username
- `send_message` - Send a chat message
- `typing` - Send typing indicator

**Server → Client:**
- `connection_response` - Connection confirmation
- `join_response` - Join confirmation
- `new_message` - New message broadcast
- `user_joined` - User joined notification
- `user_left` - User left notification
- `user_typing` - Typing indicator broadcast

## Database Schema

### Messages Collection
```json
{
  "_id": "ObjectId",
  "username": "string",
  "message": "string",
  "timestamp": "ISO 8601 datetime"
}
```

## Testing

You can test the API using curl:

```bash
# Get messages
curl http://localhost:5000/api/messages

# Send a message
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"username": "John", "message": "Hello World"}'
```
