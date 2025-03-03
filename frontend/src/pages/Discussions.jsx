import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDiscussions } from "../apiRequests";
import Navbar from "../components/Navbar";

function Discussions() {
  const [discussions, setDiscussions] = useState([]);

  useEffect(() => {
    getDiscussions().then((discussions) => setDiscussions(discussions));
  }, []);

  return (
    <>
      <Navbar />
      <div>
        <h1>Discussions</h1>
        <Link to="/create-discussion">
          <button>Create New Discussion</button>
        </Link>
        <ul>
          {discussions.map((discussion) => (
            <li key={discussion.id}>
              <Link to={`/discussions/${discussion.id}`}>
                <strong>{discussion.title}</strong> - {discussion.category?.name}
              </Link>
                <p>{discussion.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default Discussions;
