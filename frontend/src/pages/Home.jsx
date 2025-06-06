import React, { useEffect } from "react";
import Navbar from "../components/Navbar";

const Home = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll('.animate__animated');
            elements.forEach((el, index) => {
              const animation = el.getAttribute('data-animation');
              if (animation) {
                el.classList.add(animation);
                el.style.animationDelay = `${index * 0.1}s`;
              }
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll('section').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar />
      <div className="home-container">
        {/* Banner Section */}
        <section className="banner-section position-relative text-center py-5">
          <div className="banner-overlay"></div>
          <div className="container position-relative">
            <h1
              className="display-3 fw-bold text-navy mb-4 animate__animated"
              data-animation="animate__fadeInDown"
            >
              Unlock Knowledge, Gain Skills, and Grow Together
            </h1>
            <p
              className="fs-4 text-navy w-75 mx-auto mb-5 animate__animated"
              data-animation="animate__fadeInUp"
            >
              A collaborative learning platform where you earn credits by helping
              others and use them to improve your skills.
            </p>
            <a
              href="#offer"
              className="btn btn-primary btn-lg fw-semibold px-3 py-2 animate__animated"
              data-animation="animate__pulse animate__infinite"
            >
              Get Started
            </a>
          </div>
        </section>

        {/* Our Courses Section */}
        <section className="offer-section py-5" id="offer">
          <div className="container">
            <h2
              className="fw-bold mb-4 text-center display-5 animate__animated"
              data-animation="animate__fadeInUp"
            >
              What We Offer
            </h2>
            <p
              className="mb-5 fs-5 mx-auto animate__animated"
              data-animation="animate__fadeInUp"
            >
              ElevateHub is a collaborative knowledge-sharing platform, designed to
              bring together learners, educators, and professionals in a unique,
              credit-based ecosystem.
            </p>
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
                  <div
                    className="card h-100 shadow offer-card animate__animated"
                    data-animation="animate__fadeInUp"
                  >
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
        </section>

        {/* Benefits Section */}
        <section className="benefits-section py-5 bg-light">
          <div className="container">
            <h2
              className="fw-bold mb-4 text-center display-5 animate__animated"
              data-animation="animate__fadeInLeft"
            >
              Benefits
            </h2>
            <p
              className="mb-5 fs-5 mx-auto animate__animated"
              data-animation="animate__fadeInLeft"
            >
              ElevateHub is built to make sure no one has to learn alone. It brings
              people together in a way that's fair, community-driven, and
              empowering for everyone involved.
            </p>
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
                <div key={index} className="col-md-6 col-lg-4 mb-4">
                  <div
                    className="card h-100 shadow-sm benefit-card p-4 animate__animated"
                    data-animation="animate__zoomIn"
                  >
                    <h1 className="fw-bold text-primary mb-3">{benefit.number}</h1>
                    <h5 className="fw-bold mb-3">{benefit.title}</h5>
                    <p className="small text-muted">{benefit.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Credits Section */}
        <section className="credits-section py-5">
          <div className="container">
            <h2
              className="fw-bold mb-4 text-center display-5 animate__animated"
              data-animation="animate__fadeInRight"
            >
              How Credits Work
            </h2>
            <p
              className="mb-5 fs-5 mx-auto animate__animated"
              data-animation="animate__fadeInRight"
            >
              Earn credits by helping others, and use them to seek guidance from
              experienced members.
            </p>

            {/* Earning Credits Section */}
            <h3
              className="fw-bold mt-5 mb-4 animate__animated"
              data-animation="animate__fadeInRight"
            >
              Earning Credits
            </h3>
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
                <div key={index} className="col-md-6 col-lg-4 mb-4">
                  <div
                    className="card h-100 shadow-sm credit-card p-4 animate__animated"
                    data-animation="animate__fadeInUp"
                  >
                    <h5 className="fw-bold mb-3">{credit.title}</h5>
                    <p className="small text-muted">{credit.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Using Credits Section */}
            <h3
              className="fw-bold mt-5 mb-4 animate__animated"
              data-animation="animate__fadeInRight"
            >
              Using Credits
            </h3>
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
                <div key={index} className="col-md-6 col-lg-4 mb-4">
                  <div
                    className="card h-100 shadow-sm credit-card p-4 animate__animated"
                    data-animation="animate__fadeInUp"
                  >
                    <h5 className="fw-bold mb-3">{credit.title}</h5>
                    <p className="small text-muted">{credit.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section py-5 bg-light">
          <div className="container">
            <div className="row">
              <div className="col-md-4 mb-4">
                <h2
                  className="fw-bold display-5 animate__animated"
                  data-animation="animate__fadeInLeft"
                >
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="col-md-8">
                <div className="accordion" id="faqAccordion">
                  {[
                    {
                      id: "faq1",
                      collapseId: "collapse1",
                      question: "How do I earn credits?",
                      answer: "Earn credits by answering questions, helping on video calls, and sharing learning materials on the platform.",
                      button: "Explore →",
                      show: true,
                    },
                    {
                      id: "faq2",
                      collapseId: "collapse2",
                      question: "What can I use credits for?",
                      answer: "You can use credits to request help from other users, access premium learning materials, and receive expert mentorship.",
                      show: false,
                    },
                    {
                      id: "faq3",
                      collapseId: "collapse3",
                      question: "How do video calls work?",
                      answer: "Video calls are conducted via our integrated system. Once a request is accepted, both users receive a link to join the call.",
                      show: false,
                    },
                    {
                      id: "faq4",
                      collapseId: "collapse4",
                      question: "Can I contribute learning materials?",
                      answer: "Yes! You can share learning resources, tutorials, or helpful documents with the community to earn credits.",
                      show: false,
                    },
                    {
                      id: "faq5",
                      collapseId: "collapse5",
                      question: "Can I download the materials for offline access?",
                      answer: "Yes, certain learning materials are available for download so you can access them anytime, even without an internet connection.",
                      show: false,
                    },
                  ].map((faq, index) => (
                    <div
                      key={index}
                      className="accordion-item mb-3 shadow-sm animate__animated"
                      data-animation="animate__slideInUp"
                    >
                      <h2 className="accordion-header" id={faq.id}>
                        <button
                          className={`accordion-button ${faq.show ? "" : "collapsed"}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#${faq.collapseId}`}
                        >
                          {faq.question}
                        </button>
                      </h2>
                      <div
                        id={faq.collapseId}
                        className={`accordion-collapse collapse ${faq.show ? "show" : ""}`}
                        data-bs-parent="#faqAccordion"
                      >
                        <div className="accordion-body">
                          {faq.answer}
                          {faq.button && (
                            <button className="btn btn-outline-primary mt-3">
                              {faq.button}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        body {
          font-family: 'Poppins', sans-serif;
          background: #f8f9fa;
        }
        .home-container {
          overflow-x: hidden;
        }
        .animate__animated {
          opacity: 0;
        }
        .animate__animated[class*="animate__"] {
          opacity: 1;
        }
        .banner-section {
          background: url('https://images.unsplash.com/photo-1516321310768-61f0e305b6df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80') no-repeat center center;
          background-size: cover;
          min-height: 600px;
          display: flex;
          align-items: center;
          position: relative;
        }
        .banner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(186, 220, 234, 0.8), rgba(234, 234, 234, 0.8));
        }
        .text-navy {
          color: #0b2447;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        .banner-section h1 {
          font-size: 3.5rem;
          animation-duration: 0.8s;
          animation-delay: 0.2s;
        }
        .banner-section p {
          animation-duration: 0.8s;
          animation-delay: 0.4s;
        }
        .banner-section a {
          animation-duration: 1s;
          animation-delay: 0.6s;
        }
        .banner-section .btn-primary {
          background: linear-gradient(135deg, #0b2447 0%, #051124 100%);
          border: none;
          transition: transform 0.3s ease, background 0.3s ease;
        }
        .banner-section .btn-primary:hover {
          background: #1a3c6d;
          transform: translateY(-3px);
        }
        .offer-section, .benefits-section, .credits-section, .faq-section {
          padding: 80px 0;
        }
        .offer-section h2, .benefits-section h2, .credits-section h2, .faq-section h2 {
          animation-duration: 0.8s;
        }
        .offer-section p, .benefits-section p, .credits-section p {
          animation-duration: 0.8s;
        }
        .offer-card, .benefit-card, .credit-card {
          animation-duration: 0.6s;
        }
        .accordion-item {
          animation-duration: 0.7s;
        }
        .offer-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: none;
          border-radius: 15px;
          overflow: hidden;
        }
        .offer-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
        }
        .offer-card img {
          object-fit: cover;
        }
        .benefit-card, .credit-card {
          border: none;
          border-radius: 15px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .benefit-card:hover, .credit-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .accordion-item {
          border: none;
          border-radius: 10px;
          overflow: hidden;
        }
        .accordion-button {
          font-weight: 600;
          background: #fff;
          border-radius: 10px;
          color: #0b2447;
        }
        .accordion-button:not(.collapsed) {
          background: #0b2447;
          color: #fff;
        }
        .accordion-button:focus {
          box-shadow: none;
        }
        .accordion-body {
          background: #fff;
          border-radius: 0 0 10px 10px;
          color: #0b2447;
        }
        .btn-outline-primary {
          border-color: #0b2447;
          color: #0b2447;
        }
        .btn-outline-primary:hover {
          background: #0b2447;
          color: #fff;
        }
        @media (max-width: 768px) {
          .banner-section {
            min-height: 400px;
          }
          .banner-section h1 {
            font-size: 2.5rem;
          }
          .banner-section p {
            font-size: 1.2rem;
          }
          .offer-section, .benefits-section, .credits-section, .faq-section {
            padding: 50px 0;
          }
        }
      `}</style>
    </>
  );
};

export default Home;