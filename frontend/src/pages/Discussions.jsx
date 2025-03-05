import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDiscussions, getDiscussionsByCategory } from "../apiRequests";
import Navbar from "../components/Navbar";
import CategoryFilter from "../components/CategoryFilter";
import { FaCommentAlt, FaArrowUp, FaEllipsisV } from "react-icons/fa";
import { useSelector } from "react-redux";


function Discussions() {
  const [discussions, setDiscussions] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");

  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (selectedCategory) {
      getDiscussionsByCategory(selectedCategory).then(setDiscussions);
    } else {
      getDiscussions().then(setDiscussions);
    }
  }, [selectedCategory]);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h1 className="mb-3">Discussions</h1>
        {user && <Link to="/create-discussion" className="btn btn-primary mb-3">
          + Start a Discussion
        </Link>}

        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {discussions.map((discussion) => (
          <div key={discussion.id} className="card mb-3 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <img
                  src={discussion.created_by.profile}
                  alt="User Avatar"
                  className="rounded-circle me-2"
                  width="40"
                  height="40"
                />
                <div>
                  <strong>{discussion.created_by_username}</strong>
                  <p className="text-muted small">{discussion.created_at}</p>
                </div>
              </div>
              <FaEllipsisV />
            </div>

            <Link to={`/discussions/${discussion.id}`} className="text-decoration-none text-dark">
              <h5 className="fw-bold mt-2">{discussion.title}</h5>
              <p className="text-muted">{discussion.description}</p>
            </Link>

            <div className="d-flex justify-content-between align-items-center mt-2">
              <div>
                {discussion.category && (
                  <span className="badge btn-secondary me-1">{discussion.category.name}</span>
                )}
              </div>
              <div className="d-flex align-items-center text-muted">
                <FaCommentAlt className="me-1" /> {discussion.posts_count || 0}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// // Function to format time ago
// function formatTimeAgo(dateString) {
//   const date = new Date(dateString);
//   const seconds = Math.floor((new Date() - date) / 1000);
//   if (seconds < 60) return "Just now";
//   const intervals = { year: 31536000, month: 2592000, day: 86400, hour: 3600, minute: 60 };
//   for (const [key, value] of Object.entries(intervals)) {
//     const count = Math.floor(seconds / value);
//     if (count >= 1) return `${count} ${key}${count > 1 ? "s" : ""} ago`;
//   }
//   return "Just now";
// }

export default Discussions;
