import { Link } from "wouter";
import horizonLogoPath from "@assets/Horizon Logo_1750703886116.png";

interface FooterProps {
  showLinks?: boolean;
}

export function Footer({ showLinks = false }: FooterProps) {
  return (
    <footer className="mt-auto py-6 bg-neutral-50 border-t border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Links for Home page */}
          {showLinks && (
            <div className="flex space-x-6 text-sm text-neutral-600">
              <Link href="/credits" className="hover:text-primary transition-colors">
                Credits
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
          )}
          
          {/* MIT Horizon Logo */}
          <div className="flex items-center justify-center">
            <img 
              src={horizonLogoPath} 
              alt="MIT Horizon" 
              className="h-8 opacity-80 hover:opacity-100 transition-opacity duration-200"
            />
          </div>
          
          {/* Footer Text */}
          <div className="text-center text-sm text-neutral-600">
            <p>Powered by MIT Horizon</p>
          </div>
        </div>
      </div>
    </footer>
  );
}