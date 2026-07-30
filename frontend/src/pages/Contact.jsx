import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Mail, Phone, Clock, MapPin, Send, User, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const details = [
  { icon: Mail, label: 'Email us', value: 'hello@kidscolour.com', bg: 'bg-primary-100', fg: 'text-primary' },
  { icon: Phone, label: 'Call us', value: '+91 98765 43210', bg: 'bg-blue-100', fg: 'text-blue' },
  { icon: Clock, label: 'Hours', value: 'Mon–Sat, 9am – 6pm IST', bg: 'bg-green-100', fg: 'text-green-dark' },
  { icon: MapPin, label: 'Based in', value: 'Bengaluru, India', bg: 'bg-purple-100', fg: 'text-purple' },
];

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Front-end demo — a real send needs the backend (email service on :8080).
    toast.success("Thanks! We'll get back to you within 24 hours. 💌");
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Contact Us — KidsColour</title>
        <meta name="description" content="Get in touch with the KidsColour team. Questions about our digital colouring books, downloads or payments — we're happy to help!" />
        <link rel="canonical" href="https://www.kidscolour.com/contact" />
      </Helmet>

      <section className="bg-gradient-to-b from-primary-light/20 to-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-6xl mb-4">💬</div>
            <h1 className="text-4xl md:text-5xl mb-3">We'd love to hear from you!</h1>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Questions, feedback or need a hand with a download? Drop us a message and our friendly team will reply soon.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Contact info */}
          <div className="space-y-4">
            {details.map((d, i) => (
              <motion.div
                key={d.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card p-5 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-xl ${d.bg} ${d.fg} flex items-center justify-center flex-shrink-0`}>
                  <d.icon size={22} />
                </div>
                <div>
                  <div className="text-sm text-gray-400 font-bold">{d.label}</div>
                  <div className="font-bold text-gray-900">{d.value}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 card p-8 space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Your name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required value={form.name} onChange={set('name')} className="input-field pl-10" placeholder="Jane Doe" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required type="email" value={form.email} onChange={set('email')} className="input-field pl-10" placeholder="you@example.com" />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Subject</label>
              <input required value={form.subject} onChange={set('subject')} className="input-field" placeholder="How can we help?" />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Message</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-4 text-gray-400" size={18} />
                <textarea required value={form.message} onChange={set('message')} rows={5} className="input-field pl-10 resize-none" placeholder="Tell us more…" />
              </div>
            </div>

            <button type="submit" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
              <Send size={18} /> Send Message
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
