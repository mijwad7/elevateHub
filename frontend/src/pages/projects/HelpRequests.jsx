import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { createHelpRequest, getHelpRequests } from '../../apiRequests/helpRequests';
import Navbar from '../../components/Navbar';

const HelpRequests = () => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [requests, setRequests] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        credit_offer_chat: 0,
        credit_offer_video: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            const data = await getHelpRequests();
            setRequests(data);
            setLoading(false);
        };
        fetchRequests();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert("Please log in to post a help request.");
            return;
        }
        const { title, description, category, credit_offer_chat, credit_offer_video } = formData;
        const newRequest = await createHelpRequest(
            title,
            description,
            category,
            parseInt(credit_offer_chat, 10),
            parseInt(credit_offer_video, 10)
        );
        if (newRequest) {
            setRequests([...requests, newRequest]);
            setFormData({
                title: '',
                description: '',
                category: '',
                credit_offer_chat: 0,
                credit_offer_video: 0,
            });
            alert("Help request posted successfully!");
        } else {
            alert("Failed to post help request.");
        }
    };

    if (!isAuthenticated) return <p>Please log in to view this page.</p>;

    return (
        <>
            <Navbar />
            <div className="container mt-5">
                <h1>Project/Work Help</h1>
                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="mb-3">
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Title"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Description"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <input
                            type="number"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Category ID"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <input
                            type="number"
                            name="credit_offer_chat"
                            value={formData.credit_offer_chat}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Chat Credit Offer"
                            min="0"
                        />
                    </div>
                    <div className="mb-3">
                        <input
                            type="number"
                            name="credit_offer_video"
                            value={formData.credit_offer_video}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Video Credit Offer"
                            min="0"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Post Help Request</button>
                </form>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div>
                        {requests.map((req) => (
                            <div key={req.id} className="card mb-3">
                                <div className="card-body">
                                    <h5 className="card-title">{req.title}</h5>
                                    <p><strong>By:</strong> {req.created_by.username}</p>
                                    <p><strong>Status:</strong> {req.status}</p>
                                    <a href={`/help-requests/${req.id}`} className="btn btn-link">View Details</a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default HelpRequests;