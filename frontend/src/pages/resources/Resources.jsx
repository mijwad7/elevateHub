import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getResources,
  toggleVote,
  downloadResource,
  getCreditBalance,
} from "../../apiRequests";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { updateCredits } from "../../redux/authSlice";
import CategoryFilter from "../../components/CategoryFilter";

function Resources() {
  const [resources, setResources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filter, setFilter] = useState({
    search: "",
    fileType: "",
    sort: "-created_at",
  });
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    getResources().then(setResources);
  }, []);

  useEffect(() => {
    const fetchResources = async () => {
      let url = "/api/resources/";
      const params = new URLSearchParams();

      if (selectedCategory) params.append("category", selectedCategory);
      if (filter.search) params.append("search", filter.search);
      if (filter.fileType) params.append("file_type", filter.fileType);
      if (filter.sort) params.append("ordering", filter.sort);

      if (params.toString()) url += `?${params.toString()}`;

      try {
        const response = await getResources(url); // Pass custom URL
        setResources(response);
      } catch (error) {
        console.error("Error fetching filtered resources:", error);
        setResources([]);
      }
    };

    fetchResources();
  }, [selectedCategory, filter.search, filter.fileType, filter.sort]);

  const handleVote = async (resourceId) => {
    const updated = await toggleVote(resourceId);
    setResources(
      resources.map((r) =>
        r.id === resourceId
          ? { ...r, upvotes: updated.upvotes, has_upvoted: !r.has_upvoted }
          : r
      )
    );
    const newBalance = await getCreditBalance();
    dispatch(updateCredits(newBalance));
  };

  const handleDownload = async (resourceId) => {
    await downloadResource(resourceId);
    const updatedResources = await getResources();
    setResources(updatedResources);
    const newBalance = await getCreditBalance();
    dispatch(updateCredits(newBalance));
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2 className="mb-4 fw-bold">Resource Hub</h2>
        <div className="row mb-4 align-items-center">
          <div className="col-md-4 mb-3">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search resources..."
                value={filter.search}
                onChange={(e) =>
                  setFilter({ ...filter, search: e.target.value })
                }
              />
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <select
              className="form-select"
              value={filter.fileType}
              onChange={(e) =>
                setFilter({ ...filter, fileType: e.target.value })
              }
            >
              <option value="">All File Types</option>
              <option value="jpg">Images (JPG)</option>
              <option value="png">Images (PNG)</option>
              <option value="mp4">Videos (MP4)</option>
              <option value="pdf">PDFs</option>
            </select>
          </div>
          <div className="col-md-3 mb-3">
            <select
              className="form-select"
              value={filter.sort}
              onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="-upvotes">Most Popular (Upvotes)</option>
              <option value="-download_count">Most Downloaded</option>
            </select>
          </div>
          <div className="col-md-2 text-md-end mb-3">
            <Link to="/resources/upload" className="btn btn-primary w-100">
              <i className="bi bi-upload me-2"></i> Upload
            </Link>
          </div>
        </div>

        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <div className="row row-cols-1 row-cols-md-3 g-4">
          {resources.map((resource) => (
            <div key={resource.id} className="col">
              <div className="card h-100 shadow-sm border-0">
                {resource.file.endsWith(".jpg") ||
                resource.file.endsWith(".png") ||
                resource.file.endsWith(".jpeg") ? (
                  <img
                    src={resource.file}
                    className="card-img-top"
                    alt={resource.title}
                    style={{ height: "250px", objectFit: "cover" }}
                  />
                ) : resource.file.endsWith(".mp4") ? (
                  <video
                    className="card-img-top"
                    style={{ height: "250px", objectFit: "cover" }}
                    muted
                  >
                    <source src={resource.file} type="video/mp4" />
                  </video>
                ) : resource.file.endsWith(".pdf") ? (
                  <div
                    className="card-img-top bg-light text-center d-flex align-items-center justify-content-center"
                    style={{ height: "250px" }}
                  >
                    <i className="bi bi-file-earmark-pdf fs-1 text-danger"></i>
                  </div>
                ) : (
                  <div
                    className="card-img-top bg-light text-center d-flex align-items-center justify-content-center"
                    style={{ height: "250px" }}
                  >
                    <i className="bi bi-file-earmark-text fs-1 text-muted"></i>
                  </div>
                )}
                <div className="card-body">
                  <h5 className="card-title fw-semibold">
                    <Link
                      to={`/resources/${resource.id}`}
                      className="text-decoration-none text-dark"
                    >
                      {resource.title}
                    </Link>
                  </h5>
                  <p>
                    <img
                      alt="User Avatar"
                      className="rounded-circle me-2"
                      width="40"
                      height="40"
                      src={resource.uploaded_by_profile}
                    />
                    {resource.uploaded_by.username}
                  </p>
                  <p className="card-text text-muted small">
                    Category: {resource.category_detail.name}
                  </p>
                  {user && (
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleVote(resource.id)}
                        className={`btn btn-sm ${
                          resource.has_upvoted
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                      >
                        <i className="bi bi-arrow-up me-1"></i>{" "}
                        {resource.upvotes}
                      </button>
                      <a
                        target="_blank"
                        href={resource.file}
                        download
                        onClick={handleDownload}
                        className="btn btn-success"
                      >
                        <i className="bi bi-download me-1"></i>{" "}
                        {resource.download_count}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Resources;
