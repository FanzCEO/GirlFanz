'use client';

import React from 'react';

export default function AppTestPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold fanz-brand-primary mb-6">
          App Layout Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="fanz-bg-elevated p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Welcome to GirlFanz</h2>
            <p className="text-gray-300 mb-4">
              This is a test page to verify the app layout is working correctly with 
              the new FANZ branding and Tailwind CSS components.
            </p>
            <button className="fanz-bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg transition-opacity">
              Get Started
            </button>
          </div>
          
          <div className="fanz-bg-elevated p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Features</h2>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 fanz-bg-secondary rounded-full"></span>
                Modern FANZ branding
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 fanz-bg-secondary rounded-full"></span>
                Tailwind CSS styling
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 fanz-bg-secondary rounded-full"></span>
                Responsive layout
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 fanz-bg-secondary rounded-full"></span>
                Zustand state management
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 fanz-bg-elevated p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Component Test</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <button className="fanz-bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg transition-opacity">
              Primary Button
            </button>
            <button className="fanz-bg-secondary hover:opacity-90 text-black px-4 py-2 rounded-lg transition-opacity font-medium">
              Secondary Button
            </button>
            <button className="border border-gray-600 hover:border-gray-500 text-gray-300 px-4 py-2 rounded-lg transition-colors">
              Outline Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}