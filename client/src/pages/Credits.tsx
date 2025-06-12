import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Heart, Code, Palette, Database, Wrench } from "lucide-react";

export default function Credits() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credits & Attributions</h1>
          <p className="text-lg text-gray-600">
            Our platform, Found-in-Two, is built upon the hard work and creativity of many talented individuals and open-source communities. We believe in giving credit where it's due and are deeply grateful for the tools and assets that made this project possible.
          </p>
        </div>

        <div className="space-y-6">
          {/* Visual Assets & Design */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5 text-blue-600" />
                <span>Visual Assets & Design</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-800">Hand Drawn Filled Space Vectors</h4>
                <p className="text-gray-600">Vectors and icons by Good Stuff No Nonsense in CC Attribution License via SVG Repo.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Application Logo</h4>
                <p className="text-gray-600">Custom designed logo files (logo.png, ActivityLogo2.png) for the Found-in-Two platform.</p>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-purple-600 font-bold text-lg">Aa</span>
                <span>Typography</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-semibold text-gray-800">Plus Jakarta Sans</h4>
                <p className="text-gray-600">This beautiful, modern font is used throughout our interface for excellent readability. It is provided by Google Fonts under the Open Font License.</p>
              </div>
            </CardContent>
          </Card>

          {/* Core Technologies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-green-600" />
                <span>Core Technologies & Frameworks</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 mb-4">Our application is built on a modern, robust technology stack.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800">React</h4>
                  <p className="text-sm text-gray-600">The core frontend library for building our user interface. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Vite</h4>
                  <p className="text-sm text-gray-600">A next-generation frontend tooling system that provides an extremely fast development environment. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Node.js & Express</h4>
                  <p className="text-sm text-gray-600">Powers our secure and efficient backend server. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">TypeScript</h4>
                  <p className="text-sm text-gray-600">For providing static typing, which helps us write more robust and maintainable code. (Apache 2.0 License)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UI Components & Styling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-600" />
                <span>UI Components & Styling</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 mb-4">The look and feel of our application is made possible by these excellent tools.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-semibold text-gray-800">shadcn/ui</h4>
                  <p className="text-sm text-gray-600">A collection of re-usable UI components that serve as the foundation of our design system. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Tailwind CSS</h4>
                  <p className="text-sm text-gray-600">A utility-first CSS framework for rapidly building custom user interfaces. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Radix UI</h4>
                  <p className="text-sm text-gray-600">Provides a set of unstyled, accessible components that power many of our UI elements like dropdowns, dialogs, and tooltips. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Framer Motion</h4>
                  <p className="text-sm text-gray-600">Used for the delightful animations throughout the user experience. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Lucide React</h4>
                  <p className="text-sm text-gray-600">A beautiful and consistent icon set used across the application. (ISC License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Vaul</h4>
                  <p className="text-sm text-gray-600">The library behind our smooth and accessible drawers. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">canvas-confetti</h4>
                  <p className="text-sm text-gray-600">For the celebratory confetti effect on the results page. (ISC License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Recharts</h4>
                  <p className="text-sm text-gray-600">For creating beautiful and interactive charts. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">cmdk</h4>
                  <p className="text-sm text-gray-600">The command menu component used for fast, accessible navigation. (MIT License)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backend & Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <span>Backend & Data Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-semibold text-gray-800">Drizzle ORM</h4>
                  <p className="text-sm text-gray-600">A modern TypeScript ORM for interacting with our database. (Apache 2.0 License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Neon</h4>
                  <p className="text-sm text-gray-600">Our serverless Postgres database provider. (Apache 2.0 License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Passport.js</h4>
                  <p className="text-sm text-gray-600">For handling secure administrator authentication. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">connect-pg-simple</h4>
                  <p className="text-sm text-gray-600">For persistent session storage in our PostgreSQL database. (MIT License)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Development & Build Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-orange-600" />
                <span>Development & Build Tools</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 mb-4">These tools are essential to our development, testing, and build processes.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-semibold text-gray-800">Vitest</h4>
                  <p className="text-sm text-gray-600">A blazing fast unit test framework. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">esbuild</h4>
                  <p className="text-sm text-gray-600">An extremely fast JavaScript bundler and minifier. (MIT License)</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">tsx</h4>
                  <p className="text-sm text-gray-600">For seamless TypeScript execution in Node.js. (MIT License)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thank You */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="text-center py-8">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Thank You</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We extend our heartfelt gratitude to all the developers, designers, and contributors who have made these incredible tools available to the community. Open source makes projects like ours possible.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}