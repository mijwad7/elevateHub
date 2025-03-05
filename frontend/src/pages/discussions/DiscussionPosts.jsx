import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDiscussionPosts, getDiscussionDetails, toggleUpvote } from "../../apiRequests";
import Navbar from "../../components/Navbar";
import { useSelector } from "react-redux";

function DiscussionPosts() {
  const { discussionId } = useParams(); 
  const [discussion, setDiscussion] = useState(null);
  const [posts, setPosts] = useState([]);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    getDiscussionDetails(discussionId).then(setDiscussion);
    getDiscussionPosts(discussionId).then(setPosts);
  }, [discussionId]);

  const handleUpvoteToggle = async (postId) => {
    const updatedPost = await toggleUpvote(postId);
    if (updatedPost) {
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, upvotes: updatedPost.upvotes, has_upvoted: !post.has_upvoted } : post
      ));
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        {/* Discussion Details */}
        {discussion && (
          <div className="card p-3 mb-4">
            <div className="d-flex align-items-center">
              <img src={discussion.created_by.profile} alt="User" className="rounded-circle me-2" width="40" />
              <div>
                <strong>@{discussion.created_by_username}</strong>
                <small className="text-muted d-block">{discussion.created_at_formatted}</small>
              </div>
            </div>
            <h4 className="mt-2">{discussion.title}</h4>
            <p>{discussion.description}</p>
          </div>
        )}

        {/* Add to Discussion Button */}
        <div className="d-flex justify-content-end mb-3">
          <Link to={`/discussions/${discussionId}/create-discussion-post`} className="btn btn-primary">
            Add to the Discussion
          </Link>
        </div>

        {/* Discussion Posts */}
        {posts.length === 0 ? (
          <p className="text-center text-muted">No posts yet.</p>
        ) : (
          posts.map((post) => (
            <div className="card p-3 mb-3" key={post.id}>
              {/* Post Author */}
              <div className="d-flex align-items-center">
                <img src={post.user.profile} alt="User" className="rounded-circle me-2" width="40" />
                <div>
                  <strong>@{post.user_username}</strong>
                  <small className="text-muted d-block">{new Date(post.created_at).toLocaleString()}</small>
                </div>
              </div>

              {/* Post Content */}
              <p className="mt-2">{post.content}</p>

              {/* Upvote & Reply */}
              {user && <div className="d-flex align-items-center">
                <button 
                  onClick={() => handleUpvoteToggle(post.id)}
                  className={`btn btn-sm ${post.has_upvoted ? "btn-primary" : "btn-outline-primary"} me-2`}
                >
                  ⬆ {post.upvotes}
                </button>
              </div>}
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default DiscussionPosts;
