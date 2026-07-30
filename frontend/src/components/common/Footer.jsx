import { Link } from 'react-router-dom';
import logo from '../../assets/logo.webp';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <img src={logo} alt="Kids Colors" className="h-24 w-auto mb-4" />
            <p className="text-gray-500 mb-6 max-w-sm">
              Discover a world of imagination with our premium digital colouring books for kids. Print at home and let the creativity flow!
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-500">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/books" className="hover:text-primary transition-colors">All Books</Link></li>
              <li><Link to="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-2 text-gray-500">
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm border-t border-gray-100 pt-8">
          <p>&copy; {new Date().getFullYear()} KidsColour. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
