import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDiscussionPosts, toggleUpvote } from "../apiRequests";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function DiscussionPosts() {
  const { discussionId } = useParams(); // Get the discussion ID from the URL
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getDiscussionPosts(discussionId).then((posts) => setPosts(posts));
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
      <div>
        <h1>Discussion Posts</h1>
        <Link to={`/discussions/${discussionId}/create-discussion-post`}>Add to the Discussion</Link>
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <h3>{post.author}</h3>
                <p>{post.content}</p>
                <small>{new Date(post.created_at).toLocaleString()}</small>
                <div>
                  <button 
                    onClick={() => handleUpvoteToggle(post.id)}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    {post.has_upvoted ? "⬆️" : "⬆"} {/* Filled icon for upvoted */}
                  </button>
                  <span> {post.upvotes} Upvotes</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default DiscussionPosts;
