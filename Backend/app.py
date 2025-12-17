from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv
from bson.objectid import ObjectId

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
CORS(app, resources={r"/*": {"origins": "*"}})

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'chatapp')

try:
    client = MongoClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    messages_collection = db['messages']
    users_collection = db['users']
    print("[OK] Connected to MongoDB successfully")
except Exception as e:
    print(f"[ERROR] MongoDB connection error: {e}")

active_users = {}

@app.route('/')
def index():
    return jsonify({
        'status': 'Chat API is running',
        'endpoints': {
            'GET /api/messages': 'Get all messages',
            'POST /api/messages': 'Send a message',
            'WebSocket': 'Connect via Socket.IO for real-time chat'
        }
    })

@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Get all messages from the database"""
    try:
        messages = list(messages_collection.find().sort('timestamp', 1).limit(100))
        # Convert ObjectId to string for JSON serialization
        for msg in messages:
            msg['_id'] = str(msg['_id'])
        return jsonify({'messages': messages}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages', methods=['POST'])
def post_message():
    """Post a new message"""
    try:
        data = request.json
        message = {
            'username': data.get('username', 'Anonymous'),
            'message': data.get('message', ''),
            'timestamp': datetime.utcnow().isoformat()
        }
        result = messages_collection.insert_one(message)
        message['_id'] = str(result.inserted_id)
        
        # Broadcast to all connected clients
        socketio.emit('new_message', message, broadcast=True)
        
        return jsonify({'success': True, 'message': message}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    print(f'[CONNECT] Client connected: {request.sid}')
    emit('connection_response', {'status': 'connected', 'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'[DISCONNECT] Client disconnected: {request.sid}')
    # Remove user from active users
    if request.sid in active_users:
        username = active_users[request.sid]
        del active_users[request.sid]
        print(f'[DISCONNECT] User {username} removed from active users')
        print(f'[DISCONNECT] Remaining users: {list(active_users.values())}')
        # Broadcast to all remaining clients with updated user list
        socketio.emit('user_left', {
            'username': username,
            'active_users': list(active_users.values())
        })

@socketio.on('join')
def handle_join(data):
    """Handle user joining the chat"""
    username = data.get('username', 'Anonymous')
    active_users[request.sid] = username
    
    print(f'[JOIN] User {username} joined (SID: {request.sid})')
    print(f'[JOIN] Active users: {list(active_users.values())}')
    
    # Send response to the joining user
    emit('join_response', {
        'status': 'joined',
        'username': username,
        'active_users': list(active_users.values())
    })
    
    # Broadcast to ALL clients (including sender) with updated user list
    socketio.emit('user_joined', {
        'username': username,
        'active_users': list(active_users.values())
    })

@socketio.on('send_message')
def handle_message(data):
    """Handle incoming chat messages"""
    try:
        message = {
            'username': data.get('username', 'Anonymous'),
            'message': data.get('message', ''),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Save to database
        result = messages_collection.insert_one(message.copy())
        message['_id'] = str(result.inserted_id)
        
        print(f"[MESSAGE] Broadcasting message from {message['username']}: {message['message']}")
        
        # Broadcast to all clients
        socketio.emit('new_message', message)
        print(f"[MESSAGE] Broadcast complete for message ID: {message['_id']}")
        
    except Exception as e:
        print(f"[ERROR] Error handling message: {e}")
        emit('error', {'message': str(e)})

@socketio.on('typing')
def handle_typing(data):
    """Handle typing indicator"""
    emit('user_typing', {
        'username': data.get('username', 'Anonymous'),
        'isTyping': data.get('isTyping', False)
    }, skip_sid=request.sid)

@socketio.on('delete_message')
def handle_delete_message(data):
    """Handle message deletion"""
    try:
        message_id = data.get('message_id')
        if not message_id:
            return
            
        print(f"[DELETE] Request to delete message: {message_id}")
        
        # Delete from database
        result = messages_collection.delete_one({'_id': ObjectId(message_id)})
        
        if result.deleted_count > 0:
            print(f"[DELETE] Successfully deleted message: {message_id}")
            # Broadcast deletion to all clients
            socketio.emit('message_deleted', {'message_id': message_id})
        else:
            print(f"[DELETE] Message not found: {message_id}")
            
    except Exception as e:
        print(f"[ERROR] Error deleting message: {e}")
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 5000))
    print(f"Starting server on port {PORT}...")
    socketio.run(app, host='0.0.0.0', port=PORT, debug=True, allow_unsafe_werkzeug=True)
