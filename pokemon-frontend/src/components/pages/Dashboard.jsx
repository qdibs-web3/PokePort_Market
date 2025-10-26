// pokemon-frontend/src/components/pages/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import epika from '/src/assets/epika.png'; 
import ppika from '/src/assets/ppika.png';
import spika from '/src/assets/spika.png';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Intro Information Section - 3 Columns */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-yellow rounded-lg p-6">

        {/* Left Column */}
        <div className="flex flex-col items-center text-center">
          <img
            src={epika}
            alt="Card Explorer Logo"
            className="w-32 h-32 object-contain mb-4"
          />
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Card Explorer</h2>
            <Link
              to="/explore"
              className="text-white bg-indigo-500 hover:bg-indigo-600 text-xs px-3 py-1 rounded-full transition-colors"
            >
              Go
            </Link>
          </div>
          <ul className="text-gray-600 text-sm leading-relaxed max-w-md list-none space-y-2">
            <li className="flex items-center">
              <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
              Browse all Pokémon generations
            </li>
            <li className="flex items-center">
              <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
              View detailed card stats and data
            </li>
            <li className="flex items-center">
              <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
              Track prices and rarity info
            </li>
            <li className="flex items-center">
              <img src={epika} alt="bullet" className="w-5 h-5 mr-2" />
              Explore release history
            </li>
          </ul>
        </div>

        {/* Middle Column */}
        <div className="flex flex-col items-center text-center">
          <img
            src={spika}
            alt="Shop Logo"
            className="w-32 h-32 object-contain mb-4"
          />
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Shop Pokémon</h2>
            <Link
              to="/market"
              className="text-white bg-indigo-500 hover:bg-indigo-600 text-xs px-3 py-1 rounded-full transition-colors"
            >
              Go
            </Link>
          </div>
          <ul className="text-gray-600 text-sm leading-relaxed max-w-md list-none space-y-2">
            <li className="flex items-center">
              <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
              Raw & Graded Cards
            </li>
            <li className="flex items-center">
              <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
              High End Sealed Product
            </li>
            <li className="flex items-center">
              <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
              Customized Designs, Text, & Colors
            </li>
            <li className="flex items-center">
              <img src={spika} alt="bullet" className="w-5 h-5 mr-2" />
              Mystery Packs 'Coming Soon?'
            </li>
          </ul>
        </div>

        {/* Right Column */}
        <div className="flex flex-col items-center text-center">
          <img
            src={ppika}
            alt="3D Prints Logo"
            className="w-32 h-32 object-contain mb-4"
          />
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Custom 3D Prints</h2>
            <Link
              to="/market"
              className="text-white bg-indigo-500 hover:bg-indigo-600 text-xs px-3 py-1 rounded-full transition-colors"
            >
              Go
            </Link>
          </div>
          <ul className="text-gray-600 text-sm leading-relaxed max-w-md list-none space-y-2">
            <li className="flex items-center">
              <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
              Order personalized card displays
            </li>
            <li className="flex items-center">
              <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
              Choose from multiple styles
            </li>
            <li className="flex items-center">
              <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
              Match your favorite Pokémon style
            </li>
            <li className="flex items-center">
              <img src={ppika} alt="bullet" className="w-5 h-5 mr-2" />
              Community-inspired designs
            </li>
          </ul>
        </div>

      </section>
    </div>
  );
}