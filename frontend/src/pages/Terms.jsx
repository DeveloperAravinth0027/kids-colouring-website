import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const sections = [
  {
    title: '1. Introduction',
    body: 'Welcome to KidsColour. By accessing or using our website and purchasing our digital colouring books, you agree to be bound by these Terms & Conditions. Please read them carefully. If you do not agree, please do not use our services.',
  },
  {
    title: '2. Digital Products',
    body: 'All products sold on KidsColour are digital downloadable files (PDFs). No physical goods are shipped. Once payment is confirmed, you receive an instant download link by email and in your account under "My Downloads".',
  },
  {
    title: '3. Licence & Personal Use',
    body: 'Your purchase grants you a non-exclusive, non-transferable licence to download, print and use the colouring pages for personal, non-commercial use within your household. You may print pages as many times as you wish for your own family.',
  },
  {
    title: '4. What You May Not Do',
    body: 'You may not resell, redistribute, share, sublicense, or upload our files to any file-sharing or public platform. You may not claim the artwork as your own or use it for commercial purposes without written permission from KidsColour.',
  },
  {
    title: '5. Payments',
    body: 'Payments are processed securely through our third-party partners (Razorpay and Stripe). We do not store your full card details on our servers. All prices are listed in Indian Rupees (₹) unless stated otherwise and are inclusive of applicable taxes.',
  },
  {
    title: '6. Refunds',
    body: 'Because our products are digital and delivered instantly, all sales are generally final and non-refundable. If you experience a technical problem with a file (for example, a corrupted download), please contact us within 7 days and we will repair or replace it.',
  },
  {
    title: '7. Intellectual Property',
    body: 'All illustrations, designs, logos and content on KidsColour are the property of KidsColour and are protected by copyright laws. All rights not expressly granted to you are reserved.',
  },
  {
    title: '8. Accounts',
    body: 'You are responsible for keeping your account credentials secure and for all activity under your account. Please notify us immediately of any unauthorised use.',
  },
  {
    title: '9. Limitation of Liability',
    body: 'KidsColour provides its products "as is". To the maximum extent permitted by law, we are not liable for any indirect or consequential damages arising from the use of our website or products.',
  },
  {
    title: '10. Changes to These Terms',
    body: 'We may update these Terms from time to time. Continued use of the website after changes are posted constitutes acceptance of the revised Terms. Please review this page periodically.',
  },
  {
    title: '11. Contact',
    body: 'If you have any questions about these Terms & Conditions, please reach out via our Contact page or email hello@kidscolour.com.',
  },
];

const Terms = () => (
  <div className="min-h-screen">
    <Helmet>
      <title>Terms & Conditions — KidsColour</title>
      <meta name="description" content="Read the KidsColour Terms & Conditions covering digital products, licences, payments, refunds and intellectual property." />
      <link rel="canonical" href="https://www.kidscolour.com/terms" />
    </Helmet>

    <section className="bg-gradient-to-b from-purple-50 to-white py-16">
      <div className="container mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-6xl mb-4">📜</div>
          <h1 className="text-4xl md:text-5xl mb-3">Terms &amp; Conditions</h1>
          <p className="text-gray-500">Last updated: 2 July 2026</p>
        </motion.div>
      </div>
    </section>

    <div className="container mx-auto px-4 py-14 max-w-3xl">
      <div className="card p-8 md:p-10 space-y-8">
        {sections.map((s, i) => (
          <motion.section
            key={i}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 4) * 0.04 }}
          >
            <h2 className="text-xl mb-2 text-gray-900">{s.title}</h2>
            <p className="text-gray-600 leading-relaxed">{s.body}</p>
          </motion.section>
        ))}

        <div className="border-t border-gray-100 pt-6 text-gray-500">
          Questions? Visit our{' '}
          <Link to="/contact" className="text-primary font-bold hover:underline">Contact page</Link>{' '}
          or read the{' '}
          <Link to="/faq" className="text-primary font-bold hover:underline">FAQs</Link>.
        </div>
      </div>
    </div>
  </div>
);

export default Terms;
