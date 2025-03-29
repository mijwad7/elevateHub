import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  getHelpRequestDetails,
  createHelpComment,
  toggleCommentUpvote,
  startChat
} from "../../apiRequests/helpRequests";
import Navbar from "../../components/Navbar";

const HelpRequestDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [request, setRequest] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const handleStartChat = async () => {
    const chatSession = await startChat(id);
    if (chatSession) {
      navigate(`/help-requests/${id}/chat/${chatSession.id}`);
    }
  };

  useEffect(() => {
    const fetchRequest = async () => {
      const data = await getHelpRequestDetails(id);
      setRequest(data);
      setLoading(false);
    };
    fetchRequest();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please log in to comment.");
      return;
    }
    const newComment = await createHelpComment(id, comment);
    if (newComment) {
      setRequest({ ...request, comments: [...request.comments, newComment] });
      setComment("");
      alert("Comment posted!");
    }
  };

  const handleUpvote = async (requestId, commentId) => {
    if (!isAuthenticated) {
      alert("Please log in to upvote.");
      return;
    }
    const result = await toggleCommentUpvote(requestId, commentId); // Assumes requestId is in URL
    if (result) {
      const updatedComments = request.comments.map((c) =>
        c.id === commentId
          ? {
              ...c,
              upvotes:
                result.detail === "Upvote added"
                  ? c.upvotes + 1
                  : c.upvotes - 1,
              has_upvoted: result.detail === "Upvote added", // Toggle has_upvoted
            }
          : c
      );
      setRequest({ ...request, comments: updatedComments });
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!request) return <p>Request not found.</p>;

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h1>{request.title}</h1>
        <p>{request.description}</p>
        <p>
          <strong>By:</strong> {request.created_by.username}
        </p>
        <p>
          <strong>Chat Offer:</strong> {request.credit_offer_chat} credits
        </p>
        <p>
          <strong>Video Offer:</strong> {request.credit_offer_video} credits
        </p>
        <p>
          <strong>Status:</strong> {request.status}
        </p>

        {isAuthenticated &&
          request.credit_offer_chat > 0 &&
          request.created_by.id !== user?.id && (
            <button className="btn btn-success mt-3" onClick={handleStartChat}>
              Start Chat
            </button>
          )}

        <h3>Comments</h3>
        {request.comments.length > 0 ? (
          request.comments.map((c) => (
            <div key={c.id} className="card mb-2">
              <div className="card-body">
                <p>{c.content}</p>
                <p>
                  <strong>By:</strong> {c.user.username}
                </p>
                {isAuthenticated && (
                  <button
                    onClick={() => handleUpvote(id, c.id)}
                    className={`btn btn-sm ${
                      c.has_upvoted ? "btn-primary" : "btn-outline-primary"
                    }`}
                  >
                    <i className="bi-arrow-up me-1"></i>
                    {c.upvotes}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No comments yet.</p>
        )}

        {isAuthenticated && (
          <form onSubmit={handleCommentSubmit} className="mt-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="form-control mb-2"
              placeholder="Add a comment..."
              required
            />
            <button type="submit" className="btn btn-primary">
              Post Comment
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default HelpRequestDetail;
