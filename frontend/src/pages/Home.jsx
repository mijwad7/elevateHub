import React from "react";
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <>
      <Navbar />
      <div className="container mt-5">
        {/* Banner Section */}
        <div className="banner text-center py-5 px-4">
          <h1 className="fw-bold mb-3">
            Unlock Knowledge, Gain Skills, and Grow Together
          </h1>
          <p className="fs-5 w-75 mx-auto">
            A collaborative learning platform where you earn credits by helping
            others and use them to improve your skills.
          </p>
          <a href="#offer" className="btn btn-primary btn-lg mt-3 fw-semibold">
            Get Started
          </a>
        </div>

        {/* Our Courses Section */}
        <div className="mt-5">
          <h2 className="fw-bold mb-4" id="offer">What we offer</h2>
          <p className="mb-4">
          ElevateHub is a collaborative knowledge-sharing platform, designed to bring together learners, educators, and professionals in a unique, credit-based ecosystem.
          </p>
          <div className="d-flex justify-content-between align-items-center mb-4">
            
          </div>

          <div className="row">
            {[
              {
                title: "Forum Discussions",
                text: "Ask and answer questions to help the community.",
                image: "/images/discussions.jpg",
                link: "/discussions",
              },
              {
                title: "Project Help",
                text: "Get guidance on real-world projects.",
                image: "/images/help.jpg",
                link: "/help-requests",
              },
              {
                title: "Skill Improvement",
                text: "Get one-on-one help from expert users.",
                image: "/images/upskill.jpg",
                link: "/skills",
              },
              {
                title: "Resource Sharing",
                text: "Share and access useful study materials.",
                image: "/images/resources.jpg",
                link: "/resources",
              },
            ].map((course, index) => (
              <div key={index} className="col-md-6 mb-4">
                <div className="card h-100 shadow">
                  <img
                    src={course.image}
                    className="card-img-top"
                    alt={course.title}
                  />
                  <div className="card-body">
                    <h5 className="fw-bold">{course.title}</h5>
                    <p>{course.text}</p>
                    <a href={course.link} className="btn btn-outline-dark">
                      Explore
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-5">
          <h2 className="fw-bold mb-4">Benefits</h2>
          <p className="mb-4">
          ElevateHub is built to make sure no one has to learn alone. It brings people together in a way that's fair, community-driven, and empowering for everyone involved.
          </p>
          <div className="d-flex justify-content-between align-items-center mb-4">
            
          </div>

          <div className="row">
            {[
              {
                number: "01",
                title: "Earn and Use Credits",
                text: "Contribute to the community by answering questions, helping with projects, or providing mentorship through video calls. Earn credits for your efforts and use them to seek guidance from experienced members when you need it.",
              },
              {
                number: "02",
                title: "Real-Time Help",
                text: "Get instant support from peers and experts through live video calls or chat discussions. Whether you're stuck on a coding problem, need feedback on a project, or want to learn something new, real-time collaboration makes learning faster and more effective.",
              },
              {
                number: "03",
                title: "Community-Based Learning",
                text: "Join a vibrant community of learners, developers, and professionals who support each other in their learning journeys. Engage in meaningful discussions, share insights, and grow alongside like-minded individuals.",
              },
              {
                number: "04",
                title: "Project Assistance",
                text: "Working on a challenging project? Get expert advice, debugging help, or feedback from experienced professionals to refine your work and accelerate your progress.",
              },
              {
                number: "05",
                title: "Skill Improvement",
                text: "Get mentorship from expert users who can help you upskill. You can request help via video calls, chats, comments, and so on. List the skills that you want to learn and you will get help from interested users.",
              },
              {
                number: "06",
                title: "Resource Sharing",
                text: "Access a vast collection of study materials, tutorials, and curated resources shared by other learners. Contribute your own knowledge to help others while building a reputation within the community.",
              },
            ].map((benefit, index) => (
              <div key={index} className="col-md-4 mb-4">
                <div className="card h-100 shadow p-4">
                  <h1 className="fw-bold text-secondary">{benefit.number}</h1>
                  <h5 className="fw-bold">{benefit.title}</h5>
                  <p className="small">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credits Section */}
        <div className="mt-5">
          <h2 className="fw-bold mb-4">How Credits Work</h2>
          <p className="mb-4">
            Earn credits by helping others, and use them to seek guidance from
            experienced members.
          </p>
          <div className="d-flex justify-content-between align-items-center mb-4">
          </div>

          {/* Earning Credits Section */}
          <h3 className="fw-bold mt-4 mb-3">Earning Credits</h3>
          <div className="row">
            {[
              {
                number: "01",
                title: "Answer Questions in Discussions",
                text: "Help others to earn credits and use them to improve your own skills.",
              },
              {
                number: "02",
                title: "Share Valuable Learning Resources",
                text: "Connect via video calls and discussions for instant support.",
              },
              {
                number: "03",
                title: "Help Others via Video Calls",
                text: "Engage in a dynamic, supportive learning environment.",
              },
            ].map((credit, index) => (
              <div key={index} className="col-md-4 mb-4">
                <div className="card h-100 shadow p-4">
                  <h5 className="fw-bold">{credit.title}</h5>
                  <p className="small">{credit.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Using Credits Section */}
          <h3 className="fw-bold mt-5 mb-3">Using Credits</h3>
          <div className="row">
            {[
              {
                number: "04",
                title: "Request Help from Other Users",
                text: "Get expert guidance on your work and projects.",
              },
              {
                number: "05",
                title: "Access Premium Learning Materials",
                text: "Work on structured learning challenges to grow.",
              },
              {
                number: "06",
                title: "Upskill Yourself",
                text: "Get mentorship from expert users who can help you upskill.",
              },
            ].map((credit, index) => (
              <div key={index} className="col-md-4 mb-4">
                <div className="card h-100 shadow p-4">
                  <h5 className="fw-bold">{credit.title}</h5>
                  <p className="small">{credit.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <section className="container my-5">
          <div className="row">
            <div className="col-md-4">
              <h2 className="fw-bold">Frequently Asked Questions</h2>
            </div>

            <div className="col-md-8">
              <div className="accordion" id="faqAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header" id="faq1">
                    <button
                      className="accordion-button"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapse1"
                    >
                      How do I earn credits?
                    </button>
                  </h2>
                  <div
                    id="collapse1"
                    className="accordion-collapse collapse show"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body">
                      Earn credits by answering questions, helping on video
                      calls, and sharing learning materials on the platform.
                      <br />
                      <button className="btn btn-light">Explore →</button>
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header" id="faq2">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapse2"
                    >
                      What can I use credits for?
                    </button>
                  </h2>
                  <div
                    id="collapse2"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body">
                      You can use credits to request help from other users,
                      access premium learning materials, and receive expert
                      mentorship.
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header" id="faq3">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapse3"
                    >
                      How do video calls work?
                    </button>
                  </h2>
                  <div
                    id="collapse3"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body">
                      Video calls are conducted via our integrated system. Once
                      a request is accepted, both users receive a link to join
                      the call.
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header" id="faq4">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapse4"
                    >
                      Can I contribute learning materials?
                    </button>
                  </h2>
                  <div
                    id="collapse4"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body">
                      Yes! You can share learning resources, tutorials, or
                      helpful documents with the community to earn credits.
                    </div>
                  </div>
                </div>

                <div className="accordion-item">
                  <h2 className="accordion-header" id="faq5">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapse5"
                    >
                      Can I download the materials for offline access?
                    </button>
                  </h2>
                  <div
                    id="collapse5"
                    className="accordion-collapse collapse"
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body">
                      Yes, certain learning materials are available for download
                      so you can access them anytime, even without an internet
                      connection.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </div>
    </>
  );
};

export default Home;
