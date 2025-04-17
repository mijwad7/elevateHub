import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDiscussionDetails, getDiscussionPosts, toggleUpvote, getCreditBalance } from "../../apiRequests";
import Navbar from "../../components/Navbar";
import { useSelector, useDispatch } from "react-redux";
import { updateCredits } from "../../redux/authSlice";

function DiscussionPosts() {
  const { discussionId } = useParams();
  const [discussion, setDiscussion] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [discussionData, postsData] = await Promise.all([
          getDiscussionDetails(discussionId),
          getDiscussionPosts(discussionId),
        ]);
        setDiscussion(discussionData);
        setPosts(postsData);
      } catch (err) {
        setError("Failed to load discussion or posts. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [discussionId]);

  const handleUpvoteToggle = async (postId) => {
    try {
      const updatedPost = await toggleUpvote(postId);
      if (updatedPost) {
        setPosts(posts.map((post) =>
          post.id === postId
            ? { ...post, upvotes: updatedPost.upvotes, has_upvoted: !post.has_upvoted }
            : post
        ));
        const newBalance = await getCreditBalance();
        dispatch(updateCredits(newBalance));
      }
    } catch (err) {
      setError("Failed to toggle upvote. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <style>{`
          .discussion-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .discussion-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          }
          .avatar-img {
            object-fit: cover;
            border: 2px solid #e9ecef;
          }
          .upvote-btn {
            min-width: 80px;
            transition: background-color 0.3s ease;
          }
          .upvote-btn:hover {
            background-color: #0056b3;
            color: white;
          }
          .discussion-title {
            font-size: 1.75rem;
            font-weight: 600;
            color: #343a40;
          }
          .post-content {
            font-size: 1rem;
            line-height: 1.6;
            color: #495057;
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
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            ></button>
          </div>
        )}

        {/* Discussion Details */}
        {discussion && !loading && (
          <div className="card border-0 shadow-sm mb-4 discussion-card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <img
                  src={discussion.created_by.profile || "https://avatar.iran.liara.run/public/4"}
                  alt="User"
                  className="rounded-circle me-3 avatar-img"
                  width="50"
                  height="50"
                />
                <div>
                  <strong className="text-dark">@{discussion.created_by_username}</strong>
                  <small className="text-muted d-block">
                    {discussion.created_at_formatted}
                  </small>
                </div>
              </div>
              <h4 className="card-title discussion-title mb-3">{discussion.title}</h4>
              <p className="card-text post-content">{discussion.description}</p>
            </div>
          </div>
        )}

        {/* Add to Discussion Button */}
        <div className="d-flex justify-content-end mb-4">
          <Link
            to={`/discussions/${discussionId}/create-discussion-post`}
            className="btn btn-primary rounded-3 px-4"
          >
            <i className="bi bi-plus-circle me-2"></i>Add to Discussion
          </Link>
        </div>

        {/* Discussion Posts */}
        {posts.length === 0 && !loading ? (
          <div className="text-center text-muted py-5">
            <p className="fs-5">No posts yet. Be the first to contribute!</p>
          </div>
        ) : (
          <div className="row">
            {posts.map((post) => (
              <div className="col-12 mb-3" key={post.id}>
                <div className="card border-0 shadow-sm discussion-card">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <img
                        src={post.user.profile || "https://avatar.iran.liara.run/public/4"}
                        alt="User"
                        className="rounded-circle me-3 avatar-img"
                        width="40"
                        height="40"
                      />
                      <div>
                        <strong className="text-dark">@{post.user_username}</strong>
                        <small className="text-muted d-block">
                          {new Date(post.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                    <p className="card-text post-content mb-3">{post.content}</p>
                    {user && (
                      <div className="d-flex align-items-center">
                        <button
                          onClick={() => handleUpvoteToggle(post.id)}
                          className={`btn btn-sm ${
                            post.has_upvoted ? "btn-primary" : "btn-outline-primary"
                          } upvote-btn rounded-3`}
                          disabled={loading}
                        >
                          <i className="bi bi-arrow-up me-1"></i>
                          {post.upvotes}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default DiscussionPosts;