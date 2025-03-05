import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createDiscussionPost } from "../../apiRequests";
import Navbar from "../../components/Navbar";

function CreateDiscussionPost() {
  const { discussionId } = useParams();
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
      navigate(`/discussions/${discussionId}`);
    } else {
      setError("Failed to create a new post.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h3 className="card-title text-center">Create a New Post</h3>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      placeholder="What's on your mind?"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows="4"
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    Post
                  </button>
                </form>
              </div>
            </div>
            <div className="text-center mt-3">
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate(`/discussions/${discussionId}`)}
              >
                Back to Discussion
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateDiscussionPost;
