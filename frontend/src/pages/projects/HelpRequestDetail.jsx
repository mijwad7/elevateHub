import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  getHelpRequestDetails,
  createHelpComment,
  toggleCommentUpvote,
  startChat,
} from "../../apiRequests/helpRequests";
import axios from "axios";
import VideoCall from "../../components/VideoCall";
import Navbar from "../../components/Navbar";

const HelpRequestDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [request, setRequest] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [callId, setCallId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequest = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getHelpRequestDetails(id);
        setRequest(data);
      } catch (err) {
        setError("Failed to load help request. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  const handleStartChat = async () => {
    try {
      const chatSession = await startChat(id);
      if (chatSession) {
        navigate(`/help-requests/${id}/chat/${chatSession.id}`);
      }
    } catch (err) {
      setError("Failed to start chat. Please try again.");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please log in to comment.");
      return;
    }
    try {
      const newComment = await createHelpComment(id, comment);
      if (newComment) {
        setRequest({ ...request, comments: [...request.comments, newComment] });
        setComment("");
        alert("Comment posted!");
      }
    } catch (err) {
      setError("Failed to post comment. Please try again.");
    }
  };

  const handleUpvote = async (requestId, commentId) => {
    if (!isAuthenticated) {
      alert("Please log in to upvote.");
      return;
    }
    try {
      const result = await toggleCommentUpvote(requestId, commentId);
      if (result) {
        const updatedComments = request.comments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                upvotes:
                  result.detail === "Upvote added"
                    ? c.upvotes + 1
                    : c.upvotes - 1,
                has_upvoted: result.detail === "Upvote added",
              }
            : c
        );
        setRequest({ ...request, comments: updatedComments });
      }
    } catch (err) {
      setError("Failed to toggle upvote. Please try again.");
    }
  };

  const handleStartVideoCall = async () => {
    try {
      const response = await axios.post(
        `http://https://elevatehub-proxy.mijuzz007.workers.dev/api/start-video/${id}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );
      setCallId(response.data.call_id);
    } catch (error) {
      console.error("Error starting video call:", error);
      setError("Failed to start video call. Please try again.");
    }
  };

  const handleEndCall = async () => {
    if (callId) {
      setLoading(true);
      setError('');
      try {
        await axios.post(
          `http://https://elevatehub-proxy.mijuzz007.workers.dev/api/end-video/${callId}/`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access")}`,
            },
          }
        );
        console.log(`Successfully notified backend about ending call ${callId}`);
      } catch (err) {
        setError('Failed to properly notify server about ending call. Please try again.');
        console.error('Error ending video call:', err);
      } finally {
        setLoading(false);
        setCallId(null);
      }
    } else {
      setCallId(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <style>{`
          .comment-card {
            transition: background-color 0.2s ease;
          }
          .comment-card:hover {
            background-color: #f8f9fa;
          }
          .request-title {
            font-size: 2rem;
            font-weight: 600;
            color: #343a40;
          }
          .request-description {
            font-size: 1.1rem;
            line-height: 1.6;
            color: #495057;
          }
          .upvote-btn {
            min-width: 80px;
            transition: background-color 0.3s ease;
          }
          .upvote-btn:hover {
            background-color: #0056b3;
            color: white;
          }
          .avatar-img {
            object-fit: cover;
            border: 2px solid #e9ecef;
          }
          /* Base styles for our custom buttons */
          .btn-custom {
            display: inline-flex; /* Align icon and text properly */
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem; /* Generous padding */
            border-radius: 50px;   /* Pill shape for modern feel */
            border: none;
            color: white;
            font-weight: 600;    /* Slightly bolder text */
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease; /* Smooth transitions */
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); /* Subtle shadow */
            background-size: 200% auto; /* For gradient hover effect */
          }
          .btn-custom i {
            margin-right: 0.75rem; /* Space between icon and text */
            font-size: 1.1em;     /* Make icon slightly larger */
          }
          /* Chat Button Specific Styles */
          .btn-custom-chat {
            background-image: linear-gradient(to right, #26a69a 0%, #1de9b6 51%, #26a69a 100%);
          }
          .btn-custom-chat:hover {
            background-position: right center; /* Change gradient direction on hover */
            color: #fff;
            box-shadow: 0 6px 15px rgba(0, 200, 150, 0.3); /* Enhanced shadow on hover */
            transform: translateY(-2px); /* Slight lift */
          }
          /* Video Call Button Specific Styles */
          .btn-custom-video {
             background-image: linear-gradient(to right, #2962ff 0%, #5c6bc0 51%, #2962ff 100%);
          }
          .btn-custom-video:hover {
            background-position: right center;
            color: #fff;
            box-shadow: 0 6px 15px rgba(0, 100, 255, 0.3);
            transform: translateY(-2px);
          }
          /* Disabled State */
          .btn-custom:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            box-shadow: none;
            transform: none;
            background-image: none; /* Optional: remove gradient for disabled */
            background-color: #ccc;  /* Optional: use a flat grey */
          }
          /* Specific disabled colors (optional) */
          .btn-custom-chat:disabled {
            background-color: #99cec9;
          }
          .btn-custom-video:disabled {
             background-color: #a8bbf0;
          }
        `}</style>

        {/* Loading State */}
        {loading && (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            ></button>
          </div>
        )}

        {/* Help Request Details */}
        {request && !loading && (
          <div className="card border-0 shadow-sm request-card mb-5">
            <div className="card-body p-4">
              <h1 className="card-title request-title mb-3">{request.title}</h1>
              <p className="card-text request-description mb-4">
                {request.description}
              </p>
              <div className="row g-3">
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>Created by:</strong> @{request.created_by.username}
                  </p>
                  <p className="mb-2">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`badge ${
                        request.status === "open"
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {request.status}
                    </span>
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>Chat Offer:</strong> {request.credit_offer_chat}{" "}
                    credits
                  </p>
                  <p className="mb-2">
                    <strong>Video Offer:</strong> {request.credit_offer_video}{" "}
                    credits
                  </p>
                </div>
              </div>
              {isAuthenticated && request.status === "open" && (
                <div className="d-flex gap-3 mt-4">
                  {request.credit_offer_chat > 0 &&
                    request.created_by.username !== user?.username && (
                      <button
                        className="btn-custom btn-custom-chat"
                        onClick={handleStartChat}
                        disabled={loading}
                      >
                        <i className="bi bi-chat-dots-fill me-2"></i>Start Chat
                      </button>
                    )}
                  {request.created_by.username !== user?.username && (
                    <button
                      className="btn-custom btn-custom-video"
                      onClick={handleStartVideoCall}
                      disabled={loading}
                    >
                      <i className="bi bi-camera-video-fill me-2"></i>Start Video Call
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Video Call */}
        {callId && (
          <div className="mb-5">
            <VideoCall
              callId={callId}
              isHelper={true}
              onEndCall={handleEndCall}
            />
          </div>
        )}

        {/* Comment Form */}
        {isAuthenticated && (
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body p-4">
              <h4 className="card-title fs-5 mb-3">Add a Comment</h4>
              <form onSubmit={handleCommentSubmit}>
                <div className="mb-3">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="form-control rounded-3"
                    placeholder="Write your comment..."
                    rows="4"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-primary rounded-3 px-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : null}
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <h3 className="mb-4">Comments</h3>
        {request && request.comments.length > 0 ? (
          <div className="row">
            {request.comments.map((c) => (
              <div className="col-12 mb-3" key={c.id}>
                <div className="card border-0 shadow-sm comment-card">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <img
                        src={
                          c.user.profile ||
                          "https://avatar.iran.liara.run/public/4"
                        }
                        alt="User"
                        className="rounded-circle me-3 avatar-img"
                        width="40"
                        height="40"
                      />
                      <div>
                        <strong className="text-dark">
                          @{c.user.username}
                        </strong>
                        <small className="text-muted d-block">
                          {new Date(c.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                    <p className="card-text request-description mb-3">
                      {c.content}
                    </p>
                    {isAuthenticated && (
                      <button
                        onClick={() => handleUpvote(id, c.id)}
                        className={`btn btn-sm ${
                          c.has_upvoted ? "btn-primary" : "btn-outline-primary"
                        } upvote-btn rounded-3`}
                        disabled={loading}
                      >
                        <i className="bi bi-arrow-up me-1"></i>
                        {c.upvotes}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted py-4">
            <p className="fs-5">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </>
  );
};

export default HelpRequestDetail;
