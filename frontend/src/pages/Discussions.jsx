import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDiscussions } from "../apiRequests";

function Discussions() {
    const [discussions, setDiscussions] = useState([]);

    useEffect(() => {
        getDiscussions().then((discussions) => setDiscussions(discussions));
    }, []);

    return (
        <div>
            <h1>Discussions</h1>
            <Link to="/create-discussion">
                <button>Create New Discussion</button>
            </Link>
            <ul>
            {discussions.map(discussion => (
                <li key={discussion.id}>
                    <Link to={`/discussion/${discussion.id}`}>{discussion.title}</Link>
                </li>
            ))}
            </ul>
        </div>
    )
}

export default Discussions;