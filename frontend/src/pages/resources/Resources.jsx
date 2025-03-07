import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getResources,
  toggleVote,
  downloadResource,
  getCategories,
  getCreditBalance,
  getResourcesByCategory
} from "../../apiRequests";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { updateCredits } from "../../redux/authSlice";
import CategoryFilter from "../../components/CategoryFilter";

function Resources() {
  const [resources, setResources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filter, setFilter] = useState({ category: "", search: "" });
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    getResources().then(setResources);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      getResourcesByCategory(selectedCategory).then(setResources);
    } else {
      getResources().then(setResources);
    }
  }, [selectedCategory]);

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

  const filteredResources = resources.filter(
    (r) =>
      (filter.category ? r.category.id === parseInt(filter.category) : true) &&
      r.title.toLowerCase().includes(filter.search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2>Resource Hub</h2>
        <div className="row mb-3">
          <div className="col-md-10">
            <input
              type="text"
              className="form-control"
              placeholder="Search resources..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <Link to="/resources/upload" className="btn btn-primary w-100">
              Upload Resource
            </Link>
          </div>
          <br />
          <br />
          <div className="col-md-12">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        </div>
        <div className="row">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="col-md-4 mb-3">
              <div className="card h-100">
                {resource.file.endsWith(".jpg") ||
                resource.file.endsWith(".png") ? (
                  <img
                    src={resource.file}
                    className="card-img-top"
                    alt={resource.title}
                    style={{ maxHeight: "150px", objectFit: "cover" }}
                  />
                ) : resource.file.endsWith(".mp4") ? (
                  <video
                    className="card-img-top"
                    style={{ maxHeight: "150px" }}
                    muted
                  >
                    <source src={resource.file} type="video/mp4" />
                  </video>
                ) : resource.file.endsWith(".pdf") ? (
                  <iframe
                    src={`${resource.file}#toolbar=0&navpanes=0`}
                    className="card-img-top"
                    style={{ maxHeight: "150px", border: "none" }}
                    title={resource.title}
                  />
                ) : (
                  <div
                    className="card-img-top bg-light text-center p-3"
                    style={{ maxHeight: "150px" }}
                  >
                    <i className="bi bi-file-earmark-text fs-3"></i>
                  </div>
                )}
                <div className="card-body">
                  <h5 className="card-title">
                    <Link to={`/resources/${resource.id}`}>
                      {resource.title}
                    </Link>
                  </h5>
                  <p className="card-text">
                    By: @{resource.uploaded_by.username}
                  </p>
                  <p className="card-text">
                    Category: {resource.category.name}
                  </p>
                  {user && (
                    <div>
                      <button
                        onClick={() => handleVote(resource.id)}
                        className={`btn btn-sm ${
                          resource.has_upvoted
                            ? "btn-primary"
                            : "btn-outline-primary"
                        } me-2`}
                      >
                        ⬆ {resource.upvotes}
                      </button>
                      <button
                        onClick={() => handleDownload(resource.id)}
                        className="btn btn-sm btn-success"
                      >
                        Download ({resource.download_count})
                      </button>
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
