import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700">404</h1>
      <h2 className="text-2xl font-semibold mt-4 mb-6">Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/" 
        className="btn btn-primary px-6"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;