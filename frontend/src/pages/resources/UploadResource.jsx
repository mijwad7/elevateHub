import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResource, getCategories } from "../../apiRequests";
import Navbar from "../../components/Navbar";

function UploadResource() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    file: null,
  });
  const [categories, setCategories] = useState([]);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      const file = files[0];
      setFormData({ ...formData, file });
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("file", formData.file);

    const result = await uploadResource(data);
    if (result) navigate(`/resources/${result.id}`);
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2>Upload Resource</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input
              type="text"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Category</label>
            <select
              name="category"
              className="form-control"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">File</label>
            <input
              type="file"
              name="file"
              className="form-control"
              onChange={handleChange}
              accept="image/*,video/mp4,.pdf,.docx,.txt,.mp3"
              required
            />
            {preview && (
              <div className="mt-2">
                {formData.file.type.startsWith("image") ? (
                  <img src={preview} alt="Preview" className="img-fluid" style={{ maxHeight: "200px" }} />
                ) : formData.file.type === "video/mp4" ? (
                  <video controls className="w-100" style={{ maxHeight: "200px" }}>
                    <source src={preview} type="video/mp4" />
                  </video>
                ) : (
                  <p>Preview not available for this file type</p>
                )}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">Upload</button>
        </form>
      </div>
    </>
  );
}

export default UploadResource;