import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getDiscussions } from "../../apiRequests";  // We'll modify this
import Navbar from "../../components/Navbar";
import CategoryFilter from "../../components/CategoryFilter";
import { FaCommentAlt } from "react-icons/fa";

function Discussions() {
  const [discussions, setDiscussions] = useState([]);
  const [filter, setFilter] = useState({ search: "", sort: "-created_at" });
  const [selectedCategory, setSelectedCategory] = useState("");
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchDiscussions = async () => {
      let url = "/api/discussions/";
      const params = new URLSearchParams();

      if (selectedCategory) params.append("category", selectedCategory);
      if (filter.search) params.append("search", filter.search);
      if (filter.sort) params.append("ordering", filter.sort);

      if (params.toString()) url += `?${params.toString()}`;

      try {
        const response = await getDiscussions(url);  // Pass custom URL
        setDiscussions(response || []);
      } catch (error) {
        console.error("Error fetching filtered discussions:", error);
        setDiscussions([]);
      }
    };

    fetchDiscussions();
  }, [selectedCategory, filter.search, filter.sort]);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2 className="mb-4 fw-bold">Discussions</h2>

        <div className="row mb-4 align-items-center">
          <div className="col-md-5 mb-3">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search discussions..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <select
              className="form-select"
              value={filter.sort}
              onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="posts">Most Active (Posts)</option>
            </select>
          </div>
          <div className="col-md-3 text-md-end mb-3">
            {user && (
              <Link to="/create-discussion" className="btn btn-primary w-100">
                <i className="bi bi-plus me-2"></i> Start Discussion
              </Link>
            )}
          </div>
        </div>

        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <div className="row">
          {discussions.map((discussion) => (
            <div key={discussion.id} className="col-12 mb-3">
              <div className="card shadow-sm border-0 p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <img
                      src={`${import.meta.env.VITE_API_URL}${discussion.created_by_profile}` || "https://avatar.iran.liara.run/public/4"}
                      alt={discussion.created_by.username}
                      className="rounded-circle me-3"
                      width="40"
                      height="40"
                    />
                    <div>
                      <strong className="fw-medium">{discussion.created_by.username}</strong>
                      <p className="text-muted small mb-0">
                        {discussion.created_at_formatted}
                      </p>
                    </div>
                  </div>
                </div>

                <Link to={`/discussions/${discussion.id}`} className="text-decoration-none text-dark">
                  <h5 className="fw-semibold mt-2 mb-1">{discussion.title}</h5>
                  <p className="text-muted">{discussion.description}</p>
                </Link>

                <div className="d-flex justify-content-between align-items-center mt-2">
                  <div>
                    {discussion.category && (
                      <span className="badge bg-secondary me-1">{discussion.category.name}</span>
                    )}
                  </div>
                  <div className="d-flex align-items-center text-muted">
                    <FaCommentAlt className="me-1" /> {discussion.posts_count || 0}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Discussions;