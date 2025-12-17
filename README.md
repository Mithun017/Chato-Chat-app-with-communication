# Real-Time Chat Application

A simple yet feature-rich real-time chat application with Python Flask backend and React frontend.

## 🚀 Features

### Backend
- Real-time messaging using WebSocket (Socket.IO)
- MongoDB for message persistence
- REST API endpoints
- User presence tracking
- Typing indicators
- CORS enabled

### Frontend
- Modern, beautiful UI with gradients and animations
- Real-time message updates
- Active user list
- Typing indicators
- Responsive design
- Auto-scroll to latest messages

## 📁 Project Structure

```
Chatapp/
├── Backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   └── README.md          # Backend documentation
└── Frontend/
    ├── src/
    │   ├── App.jsx        # Main React component
    │   ├── App.css        # Component styles
    │   ├── index.css      # Global styles
    │   └── main.jsx       # Entry point
    ├── index.html         # HTML template
    ├── vite.config.js     # Vite configuration
    ├── package.json       # Node dependencies
    └── README.md          # Frontend documentation
```

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (running locally or remote)

### Backend Setup

1. Navigate to the Backend folder:
```bash
cd Backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Configure MongoDB (optional):
   - Edit `.env` file to change MongoDB URI if needed
   - Default: `mongodb://localhost:27017/`

4. Start the backend server:
```bash
python app.py
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the Frontend folder:
```bash
cd Frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🎯 Usage

1. **Start MongoDB** (if running locally)
2. **Start the Backend** server (port 5000)
3. **Start the Frontend** dev server (port 3000)
4. **Open your browser** to `http://localhost:3000`
5. **Enter a username** and join the chat
6. **Start chatting!** Open multiple browser windows to test real-time features

## 🔧 Configuration

### Backend Configuration (.env)
```env
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=chatapp
PORT=5000
```

### Frontend Configuration (src/App.jsx)
```javascript
const SOCKET_URL = 'http://localhost:5000';
```

## 📡 API Endpoints

### REST API
- `GET /` - API status
- `GET /api/messages` - Get all messages
- `POST /api/messages` - Send a message

### WebSocket Events
**Client → Server:**
- `connect` - Connect to server
- `join` - Join chat with username
- `send_message` - Send a message
- `typing` - Typing indicator

**Server → Client:**
- `new_message` - New message broadcast
- `user_joined` - User joined notification
- `user_left` - User left notification
- `user_typing` - Typing indicator

## 🎨 Design Features

- **Gradient backgrounds** with purple-blue theme
- **Smooth animations** for messages and UI elements
- **Custom scrollbars** matching the theme
- **Typing indicators** with animated dots
- **User avatars** with initials
- **Responsive design** for mobile and desktop
- **Connection status** indicators

## 🧪 Testing

### Test Backend API
```bash
# Get messages
curl http://localhost:5000/api/messages

# Send a message
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"username": "Test", "message": "Hello!"}'
```

### Test Real-time Features
1. Open multiple browser windows
2. Join with different usernames
3. Send messages and observe real-time updates
4. Test typing indicators
5. Check user presence in sidebar

## 📦 Technologies Used

### Backend
- Flask - Web framework
- Flask-SocketIO - WebSocket support
- PyMongo - MongoDB driver
- Flask-CORS - CORS handling
- Eventlet - Async support

### Frontend
- React 18 - UI library
- Vite - Build tool
- Socket.IO Client - WebSocket client
- Axios - HTTP client
- CSS3 - Styling

## 🚀 Production Deployment

### Backend
```bash
# Set production environment variables
# Use a production WSGI server like Gunicorn
gunicorn --worker-class eventlet -w 1 app:app
```

### Frontend
```bash
# Build for production
npm run build

# Serve the dist folder with any static server
```

## 📝 License

This project is open source and available for educational purposes.
