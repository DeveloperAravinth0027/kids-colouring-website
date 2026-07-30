import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>Page Not Found | KidsColour</title>
      </Helmet>
      
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <h1 className="text-9xl font-display text-primary mb-4">404</h1>
        <h2 className="text-3xl text-gray-900 mb-6">Oops! Page not found</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          It looks like the page you are looking for has been moved, deleted, or never existed in the first place.
        </p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    </>
  );
};

export default NotFound;
