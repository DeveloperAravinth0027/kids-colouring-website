import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Download, Home } from 'lucide-react';

const PaymentSuccess = () => (
  <div className="min-h-[70vh] container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
    <Helmet><title>Payment Successful - KidsColour</title></Helmet>

    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
      className="w-28 h-28 rounded-full bg-green flex items-center justify-center text-white text-6xl mb-8 shadow-float"
    >
      ✓
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <h1 className="text-4xl md:text-5xl mb-4">Hooray! Payment Successful 🎉</h1>
      <p className="text-lg text-gray-600 max-w-md mx-auto mb-10">
        Your colouring books are ready. In the full app, download links are emailed instantly and appear under “My Downloads”.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/my-downloads" className="btn-primary flex items-center justify-center gap-2">
          <Download size={20} /> My Downloads
        </Link>
        <Link to="/" className="btn-outline flex items-center justify-center gap-2">
          <Home size={20} /> Back Home
        </Link>
      </div>
    </motion.div>
  </div>
);

export default PaymentSuccess;
