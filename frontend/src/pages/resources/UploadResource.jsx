import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResource, getCategories } from "../../apiRequests";
import Navbar from "../../components/Navbar";

function UploadResource() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    files: [],
  });
  const [categories, setCategories] = useState([]);
  const [previews, setPreviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "files") {
      const selectedFiles = Array.from(files);
      setFormData({ ...formData, files: selectedFiles });
      const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
      setPreviews(previewUrls);
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
    formData.files.forEach((file) => {
      data.append("files", file);
    });

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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Files</label>
            <input
              type="file"
              name="files"
              className="form-control"
              onChange={handleChange}
              accept="image/*,video/mp4,.pdf,.docx,.txt,.mp3"
              multiple
              required
            />
            {previews.length > 0 && (
              <div className="mt-2 d-flex flex-wrap gap-2">
                {previews.map((preview, index) => (
                  <div key={index}>
                    {formData.files[index].type.startsWith("image") ? (
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        className="img-fluid"
                        style={{ maxHeight: "100px" }}
                      />
                    ) : formData.files[index].type === "video/mp4" ? (
                      <video
                        controls
                        className="w-100"
                        style={{ maxHeight: "100px" }}
                      >
                        <source src={preview} type="video/mp4" />
                      </video>
                    ) : (
                      <p>Preview not available for {formData.files[index].name}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            Upload
          </button>
        </form>
      </div>
    </>
  );
}

export default UploadResource;