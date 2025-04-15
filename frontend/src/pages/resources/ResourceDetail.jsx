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

  if (!resource) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-8">
            <div className="d-flex flex-wrap gap-3">
              {resource.files.map((file) => (
                <div key={file.id}>
                  {file.file.endsWith(".jpg") ||
                  file.file.endsWith(".png") ||
                  file.file.endsWith(".jpeg") ? (
                    <img
                      src={file.file}
                      className="img-fluid"
                      alt={resource.title}
                      style={{ maxHeight: "300px" }}
                    />
                  ) : file.file.endsWith(".mp4") ? (
                    <video controls className="w-100" style={{ maxHeight: "300px" }}>
                      <source src={file.file} type="video/mp4" />
                    </video>
                  ) : file.file.endsWith(".pdf") ? (
                    <iframe
                      src={file.file}
                      className="w-100"
                      style={{ height: "300px" }}
                      title={resource.title}
                    />
                  ) : (
                    <a href={file.file} download className="btn btn-primary">
                      Download {file.file.split("/").pop()}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="col-md-4">
            <h2>{resource.title}</h2>
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
            <p>Category: {resource.category_detail.name}</p>
            <p>
              Uploaded: {new Date(resource.created_at).toLocaleDateString()}
            </p>
            {user && (
              <div>
                <button
                  onClick={handleVote}
                  className={`btn ${
                    resource.has_upvoted ? "btn-primary" : "btn-outline-primary"
                  } me-2`}
                >
                  ⬆ {resource.upvotes}
                </button>
                <button
                  onClick={handleDownload}
                  className="btn btn-success"
                >
                  <i className="bi bi-download me-1"></i> {resource.download_count}
                </button>
              </div>
            )}
            <p className="mt-3">{resource.description}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default ResourceDetail;
