import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createDiscussion, getCategories } from "../apiRequests";
import Navbar from "../components/Navbar";

function CreateDiscussion() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // Added description
  const [categoryId, setCategoryId] = useState(""); // Added category selection
  const [categories, setCategories] = useState([]); // Fetch available categories
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then((data) => setCategories(data || []));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }

    const newDiscussion = await createDiscussion(title, description, categoryId);

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
          <textarea
            placeholder="Enter discussion description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button type="submit">Create Discussion</button>
        </form>
      </div>
    </>
  );
}

export default CreateDiscussion;
