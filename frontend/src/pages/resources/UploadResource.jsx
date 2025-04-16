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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => setError("Failed to load categories. Please try again."));
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
    setLoading(true);
    setError("");
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    formData.files.forEach((file) => {
      data.append("files", file);
    });

    try {
      const result = await uploadResource(data);
      if (result) navigate(`/resources/${result.id}`);
    } catch (err) {
      setError("Failed to upload resource. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h2 className="card-title mb-4 text-center">Upload a Resource</h2>
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError("")}
                    ></button>
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label fw-semibold">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className="form-control rounded-3"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Enter resource title"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label fw-semibold">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control rounded-3"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      rows="5"
                      placeholder="Describe your resource"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="category" className="form-label fw-semibold">
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      className="form-select rounded-3"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="files" className="form-label fw-semibold">
                      Files
                    </label>
                    <input
                      type="file"
                      id="files"
                      name="files"
                      className="form-control rounded-3"
                      onChange={handleChange}
                      accept="image/*,video/mp4,.pdf,.docx,.txt,.mp3"
                      multiple
                      required
                      disabled={loading}
                    />
                    {previews.length > 0 && (
                      <div className="mt-3 d-flex flex-wrap gap-3">
                        {previews.map((preview, index) => (
                          <div
                            key={index}
                            className="border rounded p-2 bg-light"
                            style={{ maxWidth: "150px" }}
                          >
                            {formData.files[index].type.startsWith("image") ? (
                              <img
                                src={preview}
                                alt={`Preview ${index}`}
                                className="img-fluid rounded"
                                style={{ maxHeight: "100px", objectFit: "cover" }}
                              />
                            ) : formData.files[index].type === "video/mp4" ? (
                              <video
                                controls
                                className="w-100 rounded"
                                style={{ maxHeight: "100px" }}
                              >
                                <source src={preview} type="video/mp4" />
                              </video>
                            ) : (
                              <div className="text-center small text-muted">
                                <i className="bi bi-file-earmark-fill me-1"></i>
                                {formData.files[index].name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-3"
                      onClick={() => navigate(-1)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary rounded-3 px-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      ) : null}
                      Upload
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default UploadResource;