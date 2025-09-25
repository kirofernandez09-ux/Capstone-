import React from 'react';
import { Star, MapPin, Users, Calendar, Heart, Eye, Car, Package, ArrowRight } from 'lucide-react';
import { assets } from "../../assets/assets";

// Banner Component
export const Banner = () => {  
  return (
    <div className='flex flex-col md:flex-row md:items-start items-center justify-between px-8 min-md:pl-14 pt-10 bg-gradient-to-r from-[#0558FE] to-[#A9CFFF] max-w-6xl mx-3 md:mx-auto rounded-2xl overflow-hidden'>  
      <div className='text-white'> 
        <h2 className='text-3xl font-medium'>Do you Own a Car?</h2>
        <p className='mt-2'>List it on our platform and earn money!</p>
        <button className='px-6 py-2 bg-blue-400 hover:bg-blue-600 transition-all text-white rounded-lg text-sm mt-4 cursor-pointer'>
          Get Started
        </button>
      </div>
      <img src={assets.banner_car_image} alt="car" className='max-h-45 mt-10'/>
    </div>
  );
};

// Title Component
export const Title = ({ title, subTitle, align }) => {   
  return (
    <div className={`flex flex-col justify-center items-center text-center ${align === "left" && "md:items-start md:text-left"}`}>
      <h1 className='font-semibold text-4xl md:text-[40px]'>{title}</h1>
      <p className='text-sm md:text-base text-gray-500/90 mt-2 max-w-156'>{subTitle}</p>
    </div>
  );
};

// Newsletter Component
export const NewsLetter = () => {
  return (
    <div className="flex flex-col items-center w-full max-w-5xl lg:w-full rounded-2xl px-4 py-12 md:py-16 mx-2 lg:mx-auto my-30 bg-gray-900 text-white">
      <div className="flex flex-col justify-center items-center text-center">
        <h1 className="text-4xl md:text-[40px]">Stay Inspired</h1>
        <p className="text-sm md:text-base text-gray-500/90 mt-2 max-w-xl">
          Join our DoRayd NewsLetter and be the first to discover new updates, exclusive offers, and inspiration.
        </p>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-6">
        <input 
          type="text" 
          className="bg-white/10 px-4 py-2.5 border border-white/20 rounded outline-none max-w-66 w-full" 
          placeholder="Enter your email" 
        />
        <button className="flex items-center justify-center gap-2 group bg-black px-4 md:px-7 py-2.5 rounded active:scale-95 transition-all">
          Subscribe
        </button>
      </div>
      <p className="text-gray-500 mt-6 text-xs text-center">
        By subscribing, you agree to our Privacy Policy and consent to receive updates.
      </p>
    </div>
  );
};

// Star Rating Component for Testimonials
const StarRating = ({ count = 5 }) => (
  <div className="flex items-center gap-1 mb-3">
    {Array.from({ length: count }).map((_, i) => (
      <svg
        key={i}
        width="20"
        height="20"
        viewBox="0 0 16 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.05 0.93C7.35 0.01 8.65 0.01 8.95 0.93L10.02 4.22C10.15 4.63 10.54 4.91 10.97 4.91H14.43C15.4 4.91 15.8 6.15 15.02 6.72L12.22 8.75C11.87 9.01 11.72 9.46 11.86 9.87L12.93 13.16C13.23 14.08 12.17 14.85 11.39 14.28L8.59 12.25C8.24 11.99 7.76 11.99 7.41 12.25L4.61 14.28C3.83 14.85 2.77 14.08 3.07 13.16L4.14 9.87C4.28 9.46 4.13 9.01 3.78 8.75L0.98 6.72C0.2 6.15 0.6 4.91 1.57 4.91H5.03C5.46 4.91 5.85 4.63 5.98 4.22L7.05 0.93Z"
          fill="#5044E5"
        />
      </svg>
    ))}
  </div>
);

// Testimonial Data
const testimonials = [
  {
    name: "DilDho",
    location: "Manila, Philippines",
    image: assets.testimonial_image_1,
    testimonial: "Very Good Service",
  },
  {
    name: "Can Thought",
    location: "Puerto Princesa, Philippines",
    image: assets.testimonial_image_2,
    testimonial: "Very Good Service",
  },
  {
    name: "Phuke Rat",
    location: "Cubao, Philippines",
    image: assets.testimonial_image_2,
    testimonial: "Very Good Service",
  },
];

// Testimonial Component
export const Testimonial = () => {
  return (
    <div className="px-6 sm:px-24 xl:px-40 py-28">
      <Title
        title="What Our Customer Says About Us?"
        subTitle="Discover something that will ease your travel concerns"
      />
      <div className="text-center mb-12">
        <h2 className="text-slate-700 text-4xl md:text-[48px] font-bold"></h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {testimonials.map((item, index) => (
          <div
            key={index}
            className="p-10 rounded-2xl bg-[#FDFDFE] shadow-xl border hover:-translate-y-1 transition"
          >
            <StarRating />
            <p className="text-gray-600 text-lg mb-6">"{item.testimonial}"</p>
            <hr className="mb-5 border-gray-300" />
            <div className="flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-full"
              />
              <div>
                <h4 className="text-lg font-semibold text-gray-700">
                  {item.name}
                </h4>
                <p className="text-sm text-gray-500">{item.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};