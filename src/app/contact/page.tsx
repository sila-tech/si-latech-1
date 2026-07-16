'use client';

import Link from 'next/link';
import { Phone, Mail, Clock, MapPin, MessageCircle, ArrowLeft, Send } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useState } from 'react';

export default function ContactPage() {
  const phoneNumber = '254141981315';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hello SI-LATECH, I would like to make an inquiry about your Beam and Block Slab system.')}`;

  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Hello SI-LATECH, my name is ${form.name}. ${form.message} My phone: ${form.phone}`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-slate-900 text-white py-16 px-4">
          <div className="container mx-auto max-w-7xl">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft size={16} /> Back to Calculator
            </Link>
            <div className="max-w-2xl">
              <span className="text-[#f59e0b] text-xs font-black uppercase tracking-widest mb-3 block">Get in Touch</span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                Contact SI-LATECH
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                Have a construction project in mind? Our team is ready to help you calculate materials 
                and provide pricing details.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-6">Reach Us Directly</h2>
                  <div className="space-y-4">

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#25D366]/40 transition-all group"
                    >
                      <div className="p-3 bg-[#25D366]/10 rounded-xl text-[#25D366] group-hover:bg-[#25D366]/20 transition-colors">
                        <MessageCircle size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-[#25D366] mb-0.5">WhatsApp (Fastest)</p>
                        <p className="text-lg font-bold text-slate-900">+254 141 981 315</p>
                        <p className="text-sm text-slate-500">Chat with us instantly — we reply fast</p>
                      </div>
                    </a>

                    <a
                      href="tel:+254141981315"
                      className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
                    >
                      <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-colors">
                        <Phone size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-primary mb-0.5">Office Line</p>
                        <p className="text-lg font-bold text-slate-900">+254 141 981 315</p>
                        <p className="text-sm text-slate-500">Mon–Sat, 8:00 AM – 5:00 PM</p>
                      </div>
                    </a>

                    <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-amber-600 mb-0.5">Location</p>
                        <p className="text-lg font-bold text-slate-900">Ruiru, behind Rubis petrol station</p>
                        <p className="text-sm text-slate-500">Serving Nairobi, Mombasa & across Kenya</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-0.5">Business Hours</p>
                        <p className="text-base font-bold text-slate-900">Monday – Friday: 8:00 AM – 5:00 PM</p>
                        <p className="text-base font-bold text-slate-900">Saturday: 8:00 AM – 1:00 PM</p>
                        <p className="text-sm text-slate-500 mt-1">WhatsApp available outside office hours</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: '500+', label: 'Projects Quoted' },
                    { value: '3+', label: 'Years Experience' },
                    { value: '30%', label: 'Cost Savings' },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center p-4 bg-slate-900 rounded-2xl text-white">
                      <p className="text-2xl font-black text-[#f59e0b]">{value}</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inquiry Form → WhatsApp */}
              <div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-900 mb-1">Send an Inquiry</h2>
                    <p className="text-slate-500 text-sm">Fill this form and we'll open WhatsApp with your message pre-filled.</p>
                  </div>

                  {submitted ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle size={32} className="text-[#25D366]" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">WhatsApp Opened!</h3>
                      <p className="text-slate-500 text-sm mb-6">Your message has been pre-filled. Just hit send in WhatsApp.</p>
                      <button
                        onClick={() => setSubmitted(false)}
                        className="text-primary text-sm font-bold hover:underline"
                      >
                        Send another inquiry
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleWhatsAppSubmit} className="space-y-5">
                      <div>
                        <label htmlFor="contact-name" className="block text-sm font-bold text-slate-900 mb-1.5">
                          Your Name
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="e.g. John Kamau"
                          className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-phone" className="block text-sm font-bold text-slate-900 mb-1.5">
                          Phone Number
                        </label>
                        <input
                          id="contact-phone"
                          type="tel"
                          required
                          value={form.phone}
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="e.g. 0712 345 678"
                          className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-message" className="block text-sm font-bold text-slate-900 mb-1.5">
                          Project Details
                        </label>
                        <textarea
                          id="contact-message"
                          required
                          rows={4}
                          value={form.message}
                          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                          placeholder="e.g. I need beams and blocks for a 3-bedroom house slab in Nairobi. Total area is about 120m²."
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full h-12 bg-[#25D366] hover:bg-[#1fbb57] text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.889.001 2.269.654 4.505 1.88 6.385l.115.2-1.362 4.955 5.064-1.325.192.113zm9.57-5.171c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.296-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        Send via WhatsApp
                      </button>
                      <p className="text-center text-xs text-slate-400">
                        This will open WhatsApp with your message. No data is stored on our servers.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
