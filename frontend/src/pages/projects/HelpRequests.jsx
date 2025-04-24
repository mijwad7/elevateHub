import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { createHelpRequest, getHelpRequests } from '../../apiRequests/helpRequests'; // Updated path
import Navbar from '../../components/Navbar';
import CategoryFilter from '../../components/CategoryFilter';

const HelpRequests = () => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [requests, setRequests] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        credit_offer_chat: 0,
        credit_offer_video: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            let url = '/api/help-requests/';
            const params = new URLSearchParams();
            if (selectedCategory) params.append('category', selectedCategory);

            if (params.toString()) url += `?${params.toString()}`;

            const [requestsData, categoriesData] = await Promise.all([
                getHelpRequests(url),
                fetchCategories(),
            ]);
            setRequests(requestsData);
            setCategories(categoriesData);
            setLoading(false);
        };
        fetchData();
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/categories/', {
                credentials: 'include',
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching categories:", error);
            return [];
        }
    };

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
            setShowModal(false);
            alert("Help request posted successfully!");
        } else {
            alert("Failed to post help request.");
        }
    };


    return (
        <>
            <Navbar />
            <div className="container mt-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Project/Work Help</h1>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        + New Help Request
                    </button>
                </div>

                <CategoryFilter
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                />

                <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Post a Help Request</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="title" className="form-label">Title</label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Enter a title"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="description" className="form-label">Description</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Describe your issue"
                                            rows="3"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="category" className="form-label">Category</label>
                                        <select
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="form-select"
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="credit_offer_chat" className="form-label">Chat Credit Offer</label>
                                        <input
                                            type="number"
                                            id="credit_offer_chat"
                                            name="credit_offer_chat"
                                            value={formData.credit_offer_chat}
                                            onChange={handleChange}
                                            className="form-control"
                                            min="0"
                                            placeholder="Credits for chat help"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="credit_offer_video" className="form-label">Video Credit Offer</label>
                                        <input
                                            type="number"
                                            id="credit_offer_video"
                                            name="credit_offer_video"
                                            value={formData.credit_offer_video}
                                            onChange={handleChange}
                                            className="form-control"
                                            min="0"
                                            placeholder="Credits for video help"
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100">Submit</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="row">
                        {requests.map((req) => (
                            <div key={req.id} className="col-md-6 col-lg-4 mb-4">
                                <div className="card h-100 shadow-sm">
                                    <div className="card-body d-flex flex-column">
                                        <div className="d-flex align-items-center mb-3">
                                            <img
                                                src={req.created_by.profile || "https://avatar.iran.liara.run/public/4"}
                                                alt={req.created_by.username}
                                                className="rounded-circle me-2"
                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                            />
                                            <div>
                                                <h5 className="card-title mb-0">{req.title}</h5>
                                                <small className="text-muted">By {req.created_by.username}</small>
                                            </div>
                                        </div>
                                        <p className="card-text flex-grow-1">{req.description.substring(0, 100)}...</p>
                                        <div className="mt-2">
                                            <span className={`badge ${req.status === 'open' ? 'bg-success' : 'bg-secondary'} me-2`}>
                                                {req.status}
                                            </span>
                                            <span className="badge bg-primary">Chat: {req.credit_offer_chat} credits</span>
                                            <span className="badge bg-primary ms-2">Video: {req.credit_offer_video} credits</span>
                                        </div>
                                        <a href={`/help-requests/${req.id}`} className="btn btn-outline-primary mt-3">View Details</a>
                                    </div>
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