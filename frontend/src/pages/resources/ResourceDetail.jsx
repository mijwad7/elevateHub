import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  getResourceDetails,
  toggleVote,
  downloadResource,
  getCategories,
  getCreditBalance,
} from "../../apiRequests";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { updateCredits } from "../../redux/authSlice";

function ResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    getResourceDetails(id).then(setResource);
  }, [id]);

  const handleVote = async () => {
    const updated = await toggleVote(id);
    setResource({
      ...resource,
      upvotes: updated.upvotes,
      has_upvoted: !resource.has_upvoted,
    });
    const newBalance = await getCreditBalance();
    dispatch(updateCredits(newBalance));
  };

  const handleDownload = async () => {
    await downloadResource(id);
    const updated = await getResourceDetails(id);
    setResource(updated);
    const newBalance = await getCreditBalance();
    dispatch(updateCredits(newBalance));
  };

  if (!resource) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
          <div className="row g-0">
            {/* Media Section */}
            <div className="col-lg-8">
              <div className="p-4">
                <div className="row row-cols-1 row-cols-md-2 g-3">
                  {resource.files.map((file) => (
                    <div key={file.id} className="col">
                      <div className="card h-100 border-0 shadow-sm overflow-hidden">
                        {file.file.endsWith(".jpg") ||
                        file.file.endsWith(".png") ||
                        file.file.endsWith(".jpeg") ? (
                          <div className="position-relative overflow-hidden">
                            <img
                              src={file.file}
                              className="card-img-top img-fluid transition-img"
                              alt={resource.title}
                              style={{ objectFit: "contain", height: "400px" }}
                            />
                          </div>
                        ) : file.file.endsWith(".mp4") ? (
                          <video
                            controls
                            className="w-100"
                            style={{ height: "200px", objectFit: "cover" }}
                          >
                            <source src={file.file} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : file.file.endsWith(".pdf") ? (
                          <div className="ratio ratio-4x3">
                            <iframe
                              src={file.file}
                              className="w-100 rounded"
                              title={resource.title}
                              style={{ border: "none" }}
                            />
                          </div>
                        ) : (
                          <div className="card-body text-center">
                            <a
                              href={file.file}
                              download
                              className="btn btn-outline-primary btn-sm w-100 transition-btn"
                            >
                              <i className="bi bi-download me-2"></i>
                              Download {file.file.split("/").pop()}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Details Section */}
            <div className="col-lg-4 bg-light">
              <div className="p-4">
                <h2 className="fw-bold mb-3 text-dark">{resource.title}</h2>
                <div className="d-flex align-items-center mb-3">
                  <img
                    alt={resource.uploaded_by.username}
                    className="rounded-circle me-2 border"
                    width="40"
                    height="40"
                    src={resource.uploaded_by_profile || "https://avatar.iran.liara.run/public/4"}
                  />
                  <Link
                    to={`/profile/${resource.uploaded_by.id}`}
                    className="text-muted text-decoration-none fw-medium"
                  >
                    {resource.uploaded_by.username}
                  </Link>
                </div>
                <p className="text-muted mb-2">
                  <span className="fw-medium">Category:</span>{" "}
                  {resource.category_detail.name}
                </p>
                <p className="text-muted mb-4">
                  <span className="fw-medium">Uploaded:</span>{" "}
                  {new Date(resource.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {user && (
                  <div className="d-flex gap-2 mb-4">
                    <button
                      onClick={handleVote}
                      className={`btn ${
                        resource.has_upvoted
                          ? "btn-primary"
                          : "btn-outline-primary"
                      } btn-sm px-3 transition-btn`}
                    >
                      <i className="bi bi-arrow-up me-1"></i>
                      Upvote ({resource.upvotes})
                    </button>
                    <a
                      href={resource.files[0].file}
                      download
                      onClick={handleDownload}
                      className="btn btn-success btn-sm px-3 transition-btn"
                    >
                      <i className="bi bi-download me-1"></i>
                      Download ({resource.download_count})
                    </a>
                  </div>
                )}
                <p className="text-dark">{resource.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ResourceDetail;