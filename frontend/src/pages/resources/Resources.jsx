import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getResources, toggleVote, downloadResource } from "../../apiRequests";
import Navbar from "../../components/Navbar";

function Resources() {
  const [resources, setResources] = useState([]);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    getResources().then(setResources);
  }, []);

  const handleVote = async (resourceId) => {
    const updated = await toggleVote(resourceId);
    setResources(
      resources.map((r) =>
        r.id === resourceId ? { ...r, upvotes: updated.upvotes } : r
      )
    );
  };

  const handleDownload = async (resourceId) => {
    await downloadResource(resourceId);
    const updatedResources = await getResources(); // Refresh to get new download count
    setResources(updatedResources);
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h2>Resource Hub</h2>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search resources..."
          />
        </div>
        {resources.map((resource) => (
          <div key={resource.id} className="card p-3 mb-3">
            <h5>{resource.title}</h5>
            <p>{resource.description}</p>
            <p>
              By: @{resource.uploaded_by_username} | Downloads:{" "}
              {resource.download_count}
            </p>
            {user && (
              <div>
                <button
                  onClick={() => handleVote(resource.id)}
                  className={`btn btn-sm ${
                    resource.has_upvoted ? "btn-primary" : "btn-outline-primary"
                  } me-2`}
                >
                  ⬆ {resource.upvotes}
                </button>
                <button
                  onClick={() => handleDownload(resource.id)}
                  className="btn btn-sm btn-success"
                >
                  Download
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default Resources;
