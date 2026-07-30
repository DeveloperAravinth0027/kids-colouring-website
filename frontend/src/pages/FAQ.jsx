import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'How do the colouring books work?',
    a: 'Every book is a high-resolution PDF. After purchase you download it instantly, then print the pages you want at home — as many times as you like.',
  },
  {
    q: 'Do I get a physical book shipped to me?',
    a: 'No — all our books are digital downloads, so there is no shipping, no waiting, and no delivery charges. You get instant access the moment you pay.',
  },
  {
    q: 'Can I print the pages more than once?',
    a: 'Absolutely! That is the best part of digital books. If your little artist makes a mistake or wants to colour a favourite page again, just reprint it for free.',
  },
  {
    q: 'What age group are the books for?',
    a: 'Each book lists an age range on its page (from toddlers to older kids). Younger sets have big, bold outlines, while older sets include more detailed illustrations.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'We accept all major cards, UPI and net-banking through our secure payment partners (Razorpay and Stripe). Your payment details are never stored on our servers.',
  },
  {
    q: 'How do I access my books after buying?',
    a: 'Your download link is emailed instantly and also appears under "My Downloads" when you are logged in, so you can re-download anytime.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Because the books are digital and downloaded immediately, we generally cannot offer refunds. If something is wrong with your file, contact us and we will make it right.',
  },
  {
    q: 'What software do I need to open the files?',
    a: 'Just a standard PDF reader, which is built into almost every phone, tablet and computer. No special software required.',
  },
];

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const FAQ = () => {
  const [open, setOpen] = useState(0);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>FAQs — KidsColour</title>
        <meta name="description" content="Frequently asked questions about KidsColour digital colouring books — downloads, printing, payments, refunds and more." />
        <link rel="canonical" href="https://www.kidscolour.com/faq" />
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <section className="bg-gradient-to-b from-blue-50 to-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-6xl mb-4">❓</div>
            <h1 className="text-4xl md:text-5xl mb-3">Frequently Asked Questions</h1>
            <p className="text-gray-600 text-lg">Everything you need to know about KidsColour.</p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-14 max-w-3xl">
        <div className="space-y-4">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.05 }}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-gray-900 text-lg">{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-primary flex-shrink-0">
                    <ChevronDown size={22} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="px-5 pb-5 text-gray-600 leading-relaxed">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12 card p-8">
          <div className="text-4xl mb-3">🙋</div>
          <h2 className="text-2xl mb-2">Still have questions?</h2>
          <p className="text-gray-600 mb-6">Our friendly team is here to help.</p>
          <Link to="/contact" className="btn-primary inline-block">Contact Us</Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
