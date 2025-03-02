import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDiscussionPosts } from "../apiRequests";
import Navbar from "../components/Navbar";

function DiscussionPosts() {
  const { discussionId } = useParams(); // Get the discussion ID from the URL
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getDiscussionPosts(discussionId).then((posts) => setPosts(posts));
  }, [discussionId]);

  return (
    <>
      <Navbar />
      <div>
        <h1>Discussion Posts</h1>
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <h3>{post.author}</h3>
                <p>{post.content}</p>
                <small>{new Date(post.created_at).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default DiscussionPosts;
