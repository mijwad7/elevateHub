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
import { Modal, Button } from "react-bootstrap";

function ResourceDetail() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
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
    await downloadResource(id); // Downloads all files as ZIP
    const updated = await getResourceDetails(id);
    setResource(updated);
    const newBalance = await getCreditBalance();
    dispatch(updateCredits(newBalance));
  };

  const handleSingleFileDownload = async (fileUrl, fileName) => {
    // For gallery/modal single-file downloads
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!resource)
    return (
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
            {/* Media Section (Gallery) */}
            <div className="col-lg-8">
              <div className="p-4">
                {resource.files.length > 0 ? (
                  <>
                    {/* Main Display */}
                    <div
                      className="main-gallery mb-4 cursor-pointer"
                      onClick={() => setShowModal(true)}
                    >
                      <div className="card border-0 shadow-sm rounded-3 overflow-hidden gallery-item">
                        {resource.files[selectedFileIndex].file.endsWith(".jpg") ||
                        resource.files[selectedFileIndex].file.endsWith(".png") ||
                        resource.files[selectedFileIndex].file.endsWith(".jpeg") ? (
                          <img
                            src={resource.files[selectedFileIndex].file}
                            className="img-fluid gallery-main-img"
                            alt={resource.title}
                            style={{ objectFit: "contain", maxHeight: "400px", width: "100%" }}
                          />
                        ) : resource.files[selectedFileIndex].file.endsWith(".mp4") ? (
                          <video
                            controls
                            className="w-100"
                            style={{ maxHeight: "400px", objectFit: "cover" }}
                          >
                            <source src={resource.files[selectedFileIndex].file} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : resource.files[selectedFileIndex].file.endsWith(".pdf") ? (
                            <iframe
                              src={resource.files[selectedFileIndex].file}
                              className="w-100 rounded"
                              style={{ width: "100%", height: "500px", border: "none" }}
                              title={resource.title}
                            />
                        ) : (
                          <div className="card-body text-center py-5 bg-light">
                            <button
                              onClick={() =>
                                handleSingleFileDownload(
                                  resource.files[selectedFileIndex].file,
                                  resource.files[selectedFileIndex].file.split("/").pop()
                                )
                              }
                              className="btn btn-primary btn-lg transition-btn"
                            >
                              <i className="bi bi-download me-2"></i>
                              Download {resource.files[selectedFileIndex].file.split("/").pop()}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Thumbnails */}
                    <div className="thumbnail-gallery d-flex flex-nowrap overflow-auto pb-3">
                      {resource.files.map((file, index) => (
                        <div
                          key={file.id}
                          className={`thumbnail-item mx-2 flex-shrink-0 cursor-pointer ${
                            selectedFileIndex === index ? "thumbnail-active" : ""
                          }`}
                          onClick={() => setSelectedFileIndex(index)}
                        >
                          <div className="card border-0 shadow-sm rounded-2 overflow-hidden">
                            {file.file.endsWith(".jpg") ||
                            file.file.endsWith(".png") ||
                            file.file.endsWith(".jpeg") ? (
                              <img
                                src={file.file}
                                className="img-fluid"
                                alt={resource.title}
                                style={{ objectFit: "cover", height: "80px", width: "120px" }}
                              />
                            ) : file.file.endsWith(".mp4") ? (
                              <video
                                className="w-100"
                                style={{ height: "80px", width: "120px", objectFit: "cover" }}
                                muted
                              >
                                <source src={file.file} type="video/mp4" />
                              </video>
                            ) : file.file.endsWith(".pdf") ? (
                              <div
                                className="d-flex align-items-center justify-content-center bg-light"
                                style={{ height: "80px", width: "120px" }}
                              >
                                <i className="bi bi-file-pdf text-muted" style={{ fontSize: "2rem" }}></i>
                              </div>
                            ) : (
                              <div
                                className="d-flex align-items-center justify-content-center bg-light text-muted small p-2"
                                style={{ height: "80px", width: "120px" }}
                              >
                                {file.file.split("/").pop()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted py-5">
                    No files available for this resource.
                  </div>
                )}
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
                {user && resource.files.length > 0 && (
                  <div className="d-flex gap-2 mb-4">
                    <button
                      onClick={handleVote}
                      className={`btn ${
                        resource.has_upvoted ? "btn-primary" : "btn-outline-primary"
                      } btn-sm px-3 transition-btn`}
                    >
                      <i className="bi bi-arrow-up me-1"></i>
                      Upvote ({resource.upvotes})
                    </button>
                    <button
                      onClick={handleDownload}
                      className="btn btn-success btn-sm px-3 transition-btn"
                    >
                      <i className="bi bi-download me-1"></i>
                      Download All ({resource.download_count})
                    </button>
                  </div>
                )}
                <p className="text-dark">{resource.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Full-Screen Preview Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        aria-labelledby="resource-preview-modal"
        className="modal-preview"
      >
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title id="resource-preview-modal" className="fw-medium">
            {resource.title} - Preview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="card border-0 rounded-0 overflow-hidden">
            {resource.files[selectedFileIndex].file.endsWith(".jpg") ||
            resource.files[selectedFileIndex].file.endsWith(".png") ||
            resource.files[selectedFileIndex].file.endsWith(".jpeg") ? (
              <img
                src={resource.files[selectedFileIndex].file}
                className="img-fluid"
                alt={resource.title}
                style={{ maxHeight: "80vh", objectFit: "contain", width: "100%" }}
              />
            ) : resource.files[selectedFileIndex].file.endsWith(".mp4") ? (
              <video
                controls
                autoPlay
                className="w-100"
                style={{ maxHeight: "80vh", objectFit: "contain" }}
              >
                <source src={resource.files[selectedFileIndex].file} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : resource.files[selectedFileIndex].file.endsWith(".pdf") ? (
              <iframe
                src={resource.files[selectedFileIndex].file}
                className="w-100"
                style={{ height: "80vh", border: "none" }}
                title={resource.title}
              />
            ) : (
              <div className="card-body text-center py-5 bg-light">
                <button
                  onClick={() =>
                    handleSingleFileDownload(
                      resource.files[selectedFileIndex].file,
                      resource.files[selectedFileIndex].file.split("/").pop()
                    )
                  }
                  className="btn btn-primary btn-lg transition-btn"
                >
                  <i className="bi bi-download me-2"></i>
                  Download {resource.files[selectedFileIndex].file.split("/").pop()}
                </button>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            disabled={selectedFileIndex === 0}
            onClick={() => setSelectedFileIndex((prev) => prev - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline-secondary"
            disabled={selectedFileIndex === resource.files.length - 1}
            onClick={() => setSelectedFileIndex((prev) => prev + 1)}
          >
            Next
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ResourceDetail;