import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { endChat } from "../../apiRequests/helpRequests";
import Navbar from "../../components/Navbar";
import { Alert, Button } from "react-bootstrap";

const ChatHelp = () => {
  const { requestId, chatId } = useParams();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [ws, setWs] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const connectWebSocket = () => {
      const accessToken = localStorage.getItem("access");
      let wsUrl = `ws://127.0.0.1:8000/api/ws/chat/${chatId}/`;
      if (accessToken && accessToken !== "undefined") {
        wsUrl += `?token=${accessToken}`;
      }
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log("WebSocket connected for chat:", chatId);
        setIsConnecting(false);
        setError(null);
        setWs(websocket);
      };

      websocket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'chat_ended') {
          setIsChatEnded(true);
          return;
        }
        if (data.content || data.image_url) {
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === data.id)) return prev;
            return [...prev, data];
          });
        }
      };

      websocket.onerror = (e) => {
        console.error("WebSocket error:", e);
        setIsConnecting(false);
        setError("Connection error occurred. Please try again later.");
      };

      websocket.onclose = (e) => {
        console.log("WebSocket closed with code:", e.code);
        setIsConnecting(false);
        if (e.code !== 1000 && !error && !isChatEnded) {
          setError("Unable to connect to chat. You may not have permission to access this chat or the chat may have ended.");
        }
      };

      return websocket;
    };

    setIsConnecting(true);
    setError(null);
    setMessages([]);
    setIsChatEnded(false);
    
    const websocket = connectWebSocket();
    return () => {
      if (websocket) websocket.close(1000, "Component unmounted");
    };
  }, [chatId, isAuthenticated, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN && message.trim()) {
      ws.send(JSON.stringify({ message }));
      setMessage("");
    }
  };

  const sendImage = () => {
    if (ws && ws.readyState === WebSocket.OPEN && image) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = reader.result.split(",")[1];
        ws.send(JSON.stringify({ image: base64Image }));
        setImage(null);
      };
      reader.readAsDataURL(image);
    }
  };

  const handleEndChat = async () => {
    if (ws) ws.close(1000, "Chat ended");
    const result = await endChat(chatId);
    if (result) navigate(`/help-requests/${requestId}`);
  };

  if (!isAuthenticated)
    return <p className="text-center mt-5">Please log in.</p>;

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <style>{`
          .chat-card {
            transition: box-shadow 0.2s ease;
          }
          .chat-card:hover {
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          }
          .message-bubble {
            border-radius: 0.75rem;
            max-width: 70%;
            word-wrap: break-word;
          }
          .user-message {
            background: linear-gradient(135deg, #0B2447 0%, #051124 100%);
            color: white;
          }
          .other-message {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
          }
          .chat-image {
            max-width: 100%;
            max-height: 200px;
            border-radius: 0.5rem;
          }
        `}</style>

        <h2 className="mb-4 text-center fw-semibold">Chat Help</h2>

        {/* Loading State */}
        {isConnecting && (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Connecting to chat...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isConnecting && error && !isChatEnded && (
          <div className="text-center">
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
            <Button
              variant="primary"
              className="rounded-3 px-4"
              onClick={() => navigate("/help-requests")}
            >
              Go Back to Help Requests
            </Button>
          </div>
        )}

        {/* Chat Interface */}
        {!isConnecting && !error && !isChatEnded && (
          <>
            <div
              className="card border-0 shadow-sm chat-card mb-4"
              style={{ height: "500px", overflowY: "auto" }}
            >
              <div className="card-body p-4">
                {messages.length === 0 ? (
                  <p className="text-muted text-center fs-5">No messages yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`d-flex mb-3 ${
                        msg.sender.username === user.username
                          ? "justify-content-end"
                          : "justify-content-start"
                      }`}
                    >
                      <div
                        className={`p-3 message-bubble ${
                          msg.sender.username === user.username
                            ? "user-message"
                            : "other-message"
                        }`}
                      >
                        <strong className="d-block mb-1">{msg.sender.username}</strong>
                        {msg.content && <p className="mb-1">{msg.content}</p>}
                        {msg.image_url && (
                          <img
                            src={`http://localhost:8000${msg.image_url}`}
                            alt="Chat image"
                            className="chat-image mt-2 d-block"
                          />
                        )}
                        <small
                          className={`d-block text-end ${
                            msg.sender.username === user.username ? "text-white" : "text-muted"
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control rounded-3"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button
                variant="primary"
                className="rounded-3"
                onClick={sendMessage}
                disabled={
                  !ws || ws.readyState !== WebSocket.OPEN || !message.trim()
                }
              >
                Send
              </Button>
            </div>

            <div className="mb-3">
              <input
                type="file"
                accept="image/*"
                className="form-control rounded-3"
                onChange={(e) => setImage(e.target.files[0])}
              />
              <Button
                variant="secondary"
                className="rounded-3 w-100 mt-2"
                onClick={sendImage}
                disabled={!ws || ws.readyState !== WebSocket.OPEN || !image}
              >
                Send Image
              </Button>
            </div>

            <Button
              variant="danger"
              className="rounded-3 w-100"
              onClick={handleEndChat}
            >
              End Chat
            </Button>
          </>
        )}

        {/* Chat Ended State */}
        {isChatEnded && (
          <div className="text-center">
            <Alert variant="info">
              This chat has been ended. You can no longer send messages.
            </Alert>
            <Button
              variant="primary"
              className="rounded-3 px-4"
              onClick={() => navigate("/help-requests")}
            >
              Go Back to Help Requests
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatHelp;