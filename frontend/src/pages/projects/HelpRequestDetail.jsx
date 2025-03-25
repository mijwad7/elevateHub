import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getHelpRequestDetails, createHelpComment, toggleCommentUpvote } from '../../apiRequests/helpRequests';
import Navbar from '../../components/Navbar';

const HelpRequestDetail = () => {
    const { id } = useParams();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [request, setRequest] = useState(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);

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
            setComment('');
            alert("Comment posted!");
        }
    };

    const handleUpvote = async (commentId) => {
        if (!isAuthenticated) {
            alert("Please log in to upvote.");
            return;
        }
        const result = await toggleCommentUpvote(commentId);
        if (result && result.detail === "Upvote added") {
            const updatedComments = request.comments.map(c =>
                c.id === commentId ? { ...c, upvotes: c.upvotes + 1 } : c
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
                <p><strong>By:</strong> {request.created_by.username}</p>
                <p><strong>Chat Offer:</strong> {request.credit_offer_chat} credits</p>
                <p><strong>Video Offer:</strong> {request.credit_offer_video} credits</p>
                <p><strong>Status:</strong> {request.status}</p>

                <h3>Comments</h3>
                {request.comments.length > 0 ? (
                    request.comments.map((c) => (
                        <div key={c.id} className="card mb-2">
                            <div className="card-body">
                                <p>{c.content}</p>
                                <p><strong>By:</strong> {c.user.username} | <strong>Upvotes:</strong> {c.upvotes}</p>
                                {isAuthenticated && (
                                    <button
                                        onClick={() => handleUpvote(c.id)}
                                        className="btn btn-sm btn-outline-primary"
                                    >
                                        Upvote
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
                        <button type="submit" className="btn btn-primary">Post Comment</button>
                    </form>
                )}
            </div>
        </>
    );
};

export default HelpRequestDetail;