import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDiscussion } from "../apiRequests";
import Navbar from "../components/Navbar";

function CreateDiscussion() {
  const [title, setTitle] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }

    const newDiscussion = await createDiscussion(title);

    if (newDiscussion){
        navigate("/discussions");
    } else {
        setError("Failed to create a new discussion.");
    }
  };

  return (
    <>
      <Navbar />
      <div>
        <h1>Create New Discussion</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter discussion title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit">Create Discussion</button>
        </form>
      </div>
    </>
  );
}

export default CreateDiscussion;
