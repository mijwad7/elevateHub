import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createDiscussion, getCategories } from "../apiRequests";
import Navbar from "../components/Navbar";

function CreateDiscussion() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
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

    const newDiscussion = await createDiscussion(
      title,
      description,
      categoryId
    );

    if (newDiscussion) {
      navigate("/discussions");
    } else {
      setError("Failed to create a new discussion.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h1 className="mb-3">Create New Discussion</h1>
        {error && <p className="text-danger">{error}</p>}
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Enter discussion title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <textarea
              className="form-control"
              placeholder="Enter discussion description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              required
            />
          </div>
          <div className="mb-3">
            <select
              className="form-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Create Discussion
          </button>
        </form>
      </div>
    </>
  );
}

export default CreateDiscussion;
