import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import { Send, Smile, Menu, X, Users, MessageSquare, Trash2 } from 'lucide-react';
import './App.css';

// Use dynamic URL based on current hostname
const SOCKET_URL = `http://${window.location.hostname}:5000`;

// Sound notification
const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');

function App() {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [username, setUsername] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [activeUsers, setActiveUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Auth State
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: ''
    });
    const [authError, setAuthError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const emojiPickerRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initialize socket connection once on mount
    useEffect(() => {
        console.log('🔌 Initializing socket connection to:', SOCKET_URL);

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            timeout: 10000
        });

        // Connection events
        newSocket.on('connect', () => {
            console.log('✅ Connected to server! Socket ID:', newSocket.id);
            setIsConnected(true);
            // Emit join event immediately after connection
            if (username) {
                console.log('🔗 Emitting join for:', username);
                newSocket.emit('join', { username });
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from server. Reason:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('⚠️ Connection error:', error.message);
            setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Reconnected after', attemptNumber, 'attempts');
            setIsConnected(true);
        });

        // Message events
        newSocket.on('new_message', (message) => {
            console.log('📨 NEW MESSAGE received:', message);
            setMessages((prevMessages) => {
                // Check for duplicates
                const isDuplicate = prevMessages.some(m => m._id === message._id);
                if (isDuplicate) return prevMessages;

                // Play sound if message is not from self
                if (message.username !== username) {
                    notificationSound.play().catch(e => console.log('Audio play failed:', e));
                }

                return [...prevMessages, message];
            });
        });

        // Handle message deletion
        newSocket.on('message_deleted', (data) => {
            console.log('🗑️ Message deleted:', data.message_id);
            setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== data.message_id));
        });

        newSocket.on('user_joined', (data) => {
            console.log('👋 User joined:', data.username, '| Active users:', data.active_users);
            // Update active users list immediately
            setActiveUsers(data.active_users || []);
            // Add system message
            setMessages((prev) => [...prev, {
                type: 'system',
                message: `${data.username} joined the chat`,
                timestamp: new Date().toISOString()
            }]);
        });

        newSocket.on('user_left', (data) => {
            console.log('👋 User left:', data.username);
            // Update with server's active users list if provided
            if (data.active_users) {
                setActiveUsers(data.active_users);
            } else {
                // Fallback: filter locally
                setActiveUsers((prev) => prev.filter(u => u !== data.username));
            }
            setMessages((prev) => [...prev, {
                type: 'system',
                message: `${data.username} left the chat`,
                timestamp: new Date().toISOString()
            }]);
        });

        newSocket.on('user_typing', (data) => {
            if (data.isTyping) {
                setTypingUsers((prev) => [...new Set([...prev, data.username])]);
            } else {
                setTypingUsers((prev) => prev.filter(u => u !== data.username));
            }
        });

        newSocket.on('join_response', (data) => {
            console.log('✅ Join response:', data);
            setActiveUsers(data.active_users || []);
        });

        setSocket(newSocket);

        // Cleanup only on unmount
        return () => {
            console.log('🧹 Cleaning up socket connection');
            newSocket.disconnect();
        };
    }, [isJoined, username]); // Re-run if joined status or username changes

    // Fetch initial messages
    useEffect(() => {
        if (isJoined) {
            fetch(`${SOCKET_URL}/api/messages`)
                .then(res => res.json())
                .then(data => {
                    if (data.messages) {
                        setMessages(data.messages);
                    }
                })
                .catch(err => console.error('Error fetching messages:', err));
        }
    }, [isJoined]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthError('');
        setIsLoading(true);

        const endpoint = authMode === 'login' ? '/api/login' : '/api/signup';

        try {
            const response = await fetch(`${SOCKET_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            console.log('Auth successful:', data);
            setUsername(data.user.name); // Set username from response
            setIsJoined(true); // Trigger socket connection

        } catch (err) {
            console.error('Auth error:', err);
            setAuthError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (username.trim() && socket) {
            socket.emit('join', { username: username.trim() });
            socket.on('join_response', (data) => {
                setIsJoined(true);
                setActiveUsers(data.active_users || []);
            });
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputMessage.trim() && socket && isJoined) {
            console.log('📤 Sending message:', inputMessage);
            socket.emit('send_message', {
                username,
                message: inputMessage.trim()
            });
            setInputMessage('');
            setShowEmojiPicker(false);

            socket.emit('typing', { username, isTyping: false });
        }
    };

    const handleDeleteMessage = (messageId) => {
        if (socket && isJoined) {
            if (window.confirm('Are you sure you want to delete this message?')) {
                console.log('🗑️ Deleting message:', messageId);
                socket.emit('delete_message', { message_id: messageId });
            }
        }
    };

    const handleTyping = (e) => {
        setInputMessage(e.target.value);

        if (socket && isJoined) {
            // Send typing indicator
            socket.emit('typing', { username, isTyping: true });

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 2 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing', { username, isTyping: false });
            }, 2000);
        }
    };

    const onEmojiClick = (emojiObject) => {
        setInputMessage((prev) => prev + emojiObject.emoji);
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Check if message should show header (username/time)
    const shouldShowHeader = (currentMsg, prevMsg) => {
        if (!prevMsg || prevMsg.type === 'system') return true;
        if (currentMsg.username !== prevMsg.username) return true;

        // Also show header if more than 5 minutes passed
        const timeDiff = new Date(currentMsg.timestamp) - new Date(prevMsg.timestamp);
        return timeDiff > 5 * 60 * 1000;
    };

    if (!isJoined) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-icon">
                            <MessageSquare size={48} color="#25D366" />
                        </div>
                        <h1>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                        <p>{authMode === 'login' ? 'Login to continue chatting' : 'Sign up to get started'}</p>
                    </div>

                    {authError && <div className="auth-error">{authError}</div>}

                    <form onSubmit={handleAuth} className="login-form">
                        {authMode === 'signup' && (
                            <div className="input-group">
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="username-input"
                                    required
                                />
                            </div>
                        )}
                        <div className="input-group">
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="username-input"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="username-input"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="join-button"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="auth-switch">
                        <p>
                            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button
                                className="switch-btn"
                                onClick={() => {
                                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                                    setAuthError('');
                                    setFormData({ name: '', phone: '', password: '' });
                                }}
                            >
                                {authMode === 'login' ? 'Sign Up' : 'Login'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            {/* Mobile Header */}
            <div className="mobile-header">
                <button className="menu-button" onClick={() => setIsSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <h2>ChatApp</h2>
                <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
            </div>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            <div className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="header-title">
                        <Users size={20} />
                        <h3>Active Users</h3>
                    </div>
                    <span className="user-count">{activeUsers.length}</span>
                    <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>
                <div className="users-list">
                    {activeUsers.map((user, index) => (
                        <div key={index} className="user-item">
                            <span className="user-avatar">{user.charAt(0).toUpperCase()}</span>
                            <span className="user-name">{user}</span>
                            {user === username && <span className="you-badge">You</span>}
                        </div>
                    ))}
                </div>
                <div className="sidebar-footer">
                    <div className="connection-info">
                        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                        {isConnected ? 'Connected' : 'Reconnecting...'}
                    </div>
                </div>
            </div>

            <div className="chat-main">
                <div className="chat-header desktop-only">
                    <div className="header-info">
                        <h2>Chat Room</h2>
                        <p className="welcome-text">Logged in as <strong>{username}</strong></p>
                    </div>
                    <div className="connection-indicator">
                        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                        {isConnected ? 'Online' : 'Offline'}
                    </div>
                </div>

                <div className="messages-container">
                    {messages.map((msg, index) => {
                        const showHeader = shouldShowHeader(msg, messages[index - 1]);
                        return (
                            <div
                                key={msg._id || index}
                                className={`message ${msg.type === 'system' ? 'system-message' : msg.username === username ? 'sent' : 'received'} ${!showHeader ? 'grouped' : ''}`}
                            >
                                {msg.type === 'system' ? (
                                    <div className="system-text">{msg.message}</div>
                                ) : (
                                    <>
                                        {showHeader && (
                                            <div className="message-header">
                                                <span className="message-username">{msg.username}</span>
                                            </div>
                                        )}
                                        <div className="message-content-wrapper">
                                            <div className="message-content">
                                                {msg.message}
                                                <span className="message-time">{formatTime(msg.timestamp)}</span>
                                            </div>
                                            {/* Delete button only for own messages */}
                                            {msg.username === username && (
                                                <button
                                                    className="delete-button"
                                                    onClick={() => handleDeleteMessage(msg._id)}
                                                    title="Delete message"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {typingUsers.length > 0 && (
                        <div className="typing-indicator">
                            <span className="typing-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                            <span className="typing-text">
                                {typingUsers.join(', ')} typing...
                            </span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />

                    {/* Scroll to bottom button could go here */}
                </div>

                <form onSubmit={handleSendMessage} className="message-input-container">
                    <div className="emoji-container" ref={emojiPickerRef}>
                        <button
                            type="button"
                            className="emoji-button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <Smile size={24} />
                        </button>
                        {showEmojiPicker && (
                            <div className="emoji-picker-wrapper">
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme="dark"
                                    width={300}
                                    height={400}
                                />
                            </div>
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={inputMessage}
                        onChange={handleTyping}
                        className="message-input"
                        disabled={!isConnected}
                    />
                    <button
                        type="submit"
                        className="send-button"
                        disabled={!inputMessage.trim() || !isConnected}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default App;
