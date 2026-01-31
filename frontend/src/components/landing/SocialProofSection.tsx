'use client';

import { StarIcon } from '@heroicons/react/24/solid';

const reviews = [
  {
    quote: "We saw a 40% increase in qualified leads within the first week. The AI actually understands our product nuances.",
    author: "Sarah Jenkings",
    role: "Head of Growth, TechFlow",
    image: "SJ"
  },
  {
    quote: "Insydr handles our 2 a.m. traffic when our team is asleep. We wake up to booked demos every morning.",
    author: "David Chen",
    role: "Founder, ScaleUp",
    image: "DC"
  },
  {
    quote: "Setup was incredibly easy. It literally learned our documentation in minutes. Game changer.",
    author: "Emily Ross",
    role: "Marketing Director, CloudNine",
    image: "ER"
  }
];

export default function SocialProofSection() {
  return (
    <section className="py-24 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 p-8 rounded-3xl relative">
              <div className="flex gap-1 mb-4 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} className="h-5 w-5" />
                ))}
              </div>
              <p className="text-gray-300 mb-6 text-lg">"{review.quote}"</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center font-bold text-white text-sm">
                  {review.image}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{review.author}</p>
                  <p className="text-gray-500 text-xs">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
