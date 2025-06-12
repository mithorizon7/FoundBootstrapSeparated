import { Link } from "wouter";
import logoSrc from "@assets/ActivityLogo2.png";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <img 
              src={logoSrc} 
              alt="Found-in-Two Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold text-neutral-800">Found-in-Two</span>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <Link href="/privacy">
              <span className="hover:text-gray-900 transition-colors cursor-pointer">
                Privacy Policy
              </span>
            </Link>
            <Link href="/credits">
              <span className="hover:text-gray-900 transition-colors cursor-pointer">
                Credits & Attributions
              </span>
            </Link>
          </div>
          
          {/* Copyright */}
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Found-in-Two. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}