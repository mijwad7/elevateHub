import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createDiscussionPost } from "../apiRequests";
import Navbar from "../components/Navbar";

function CreateDiscussionPost() {
  const { discussionId } = useParams(); // Get discussion ID from URL
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Post content cannot be empty.");
      return;
    }

    const newPost = await createDiscussionPost(discussionId, content);

    if (newPost) {
      navigate(`/discussions/${discussionId}`); // Redirect to discussion page
    } else {
      setError("Failed to create a new post.");
    }
  };

  return (
    <>
      <Navbar />
      <div>
        <h1>Create a New Post</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Enter your post content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
            cols="50"
          />
          <br />
          <button type="submit">Post</button>
        </form>
      </div>
    </>
  );
}

export default CreateDiscussionPost;
