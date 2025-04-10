import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { endChat } from "../../apiRequests/helpRequests";
import Navbar from "../../components/Navbar";

const ChatHelp = () => {
  const { requestId, chatId } = useParams();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null); // New state for image file
  const [ws, setWs] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
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
        setIsConnecting(false);
      };
      websocket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.content || data.image_url) {
          // Handle both text and images
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === data.id)) return prev;
            return [...prev, data];
          });
        }
      };
      websocket.onerror = (e) => console.error("WebSocket error:", e);
      websocket.onclose = (e) => {
        setIsConnecting(false);
        if (e.code === 4001) navigate("/login");
        else if (e.code !== 1000) setTimeout(connectWebSocket, 1000);
      };
      setWs(websocket);
      return websocket;
    };

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
        const base64Image = reader.result.split(",")[1]; // Remove "data:image/jpeg;base64,"
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
      <div className="container mt-5">
        <h2 className="mb-4 text-center">Chat Help</h2>
        <div
          className="card shadow-sm"
          style={{ height: "500px", overflowY: "auto" }}
        >
          <div className="card-body p-3">
            {isConnecting ? (
              <p className="text-muted text-center">Connecting to chat...</p>
            ) : messages.length === 0 ? (
              <p className="text-muted text-center">No messages yet.</p>
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
                    className={`p-2 rounded ${
                      msg.sender.username === user.username
                        ? "bg-primary text-white"
                        : "bg-light border"
                    }`}
                    style={{ maxWidth: "70%" }}
                  >
                    <strong>{msg.sender.username}</strong>
                    {msg.content && <p className="mb-1">{msg.content}</p>}
                    {msg.image_url && (
                      <img
                        src={`http://localhost:8000${msg.image_url}`}
                        alt="Chat image"
                        className="img-fluid mt-2 d-block"
                        style={{ maxWidth: "100%", maxHeight: "200px" }}
                      />
                    )}
                    <small className="text-muted">
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
        <div className="input-group mt-3">
          <input
            type="text"
            className="form-control"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={
              !ws || ws.readyState !== WebSocket.OPEN || !message.trim()
            }
          >
            Send
          </button>
        </div>
        <div className="mt-3">
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => setImage(e.target.files[0])}
          />
          <button
            className="btn btn-secondary mt-2 w-100"
            onClick={sendImage}
            disabled={!ws || ws.readyState !== WebSocket.OPEN || !image}
          >
            Send Image
          </button>
        </div>
        <button className="btn btn-danger mt-3 w-100" onClick={handleEndChat}>
          End Chat
        </button>
      </div>
    </>
  );
};

export default ChatHelp;
