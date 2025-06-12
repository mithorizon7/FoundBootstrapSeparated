import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Shield, Lock, Users, Database, Eye, UserCheck } from "lucide-react";

export default function Privacy() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-lg text-gray-600">
            <strong>Effective Date:</strong> June 12, 2025
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Introduction</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Welcome to Found-in-Two. We are committed to protecting your privacy and providing a transparent experience. This Privacy Policy explains what information we collect, how we use and protect it, and the rights you have regarding your information.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                This policy applies to all users of the Found-in-Two web application (the "Service"), including team participants and administrators.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-green-600" />
                <span>Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">We collect information in a few different ways, depending on how you use the Service.</p>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">A. Information You Provide to Us</h4>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Team Information:</strong> When you create or join a team, we store the Team Name and the unique Team Code you use to access your workspace.</li>
                  <li><strong>Admin Information:</strong> To secure the administrative dashboard, we collect a Username and a securely hashed Password for admin accounts.</li>
                  <li><strong>Bootcamp Progress:</strong> As you complete each phase of the bootcamp, we save the data and answers you provide in the form fields. This allows you and your team to persist progress and build upon your work in later phases.</li>
                  <li><strong>Cohort & Voting Information:</strong> If you participate in a cohort showcase, we store your team's assignment to a specific cohort, your final submitted website URL, and the votes you cast for other teams.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">B. Information We Collect Automatically</h4>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Session Information (for logged-in users):</strong> We use cookies to manage your login sessions securely.
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• <strong>For Teams:</strong> When you log in with your access token, a session is created to remember your team's identity as you navigate the site.</li>
                      <li>• <strong>For Admins:</strong> When you log in with your username and password, a session is created to grant you access to the admin dashboard.</li>
                    </ul>
                  </li>
                  <li><strong>Local Storage Data (for anonymous users):</strong> If you use the Service without creating or joining a team, your progress through the phases is saved directly in your browser's local storage. This data is not sent to our servers and remains on your computer.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <span>How We Use Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">We use the information we collect for the following purposes:</p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>To Provide and Maintain the Service:</strong> To save your team's progress, allow you to resume your work, and manage your journey through the 8 phases.</li>
                <li><strong>To Authenticate Users:</strong> To securely log in admins and teams and protect access to their respective dashboards and data.</li>
                <li><strong>To Facilitate Bootcamp Activities:</strong> To run the cohort-based showcase, manage voting, and display results as controlled by the administrator.</li>
                <li><strong>For Administrative Purposes:</strong> To allow instructors to monitor team progress and manage the bootcamp experience via the admin dashboard.</li>
              </ul>
              <p className="text-gray-700 mt-4 font-medium">
                We do not use your information for advertising or sell your data to third parties.
              </p>
            </CardContent>
          </Card>

          {/* How We Share Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-orange-600" />
                <span>How We Share Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">We are committed to not sharing your personal information, with the following limited exceptions:</p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Within a Showcase Cohort:</strong> If your team is part of a cohort and you submit a website, your team name and submitted website URL will be visible to other teams within that same cohort for voting purposes.</li>
                <li><strong>With Service Providers:</strong> We use Neon as our database provider to store application data. They are bound by their own strict privacy and security policies.</li>
                <li><strong>For Legal Reasons:</strong> We may share information if required to do so by law or in response to valid requests by public authorities.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Storage and Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-red-600" />
                <span>Data Storage and Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">We take the security of your data seriously.</p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Data Storage:</strong> Your application data is stored securely in our PostgreSQL database, hosted by Neon.</li>
                <li><strong>Password Security:</strong> Administrator passwords are not stored in plaintext; they are securely hashed using bcrypt.</li>
                <li><strong>Access Tokens:</strong> Teams are identified by a unique, randomly generated access token to secure their session data.</li>
                <li><strong>Data Transmission:</strong> We use standard security protocols for data transmission.</li>
              </ul>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  While we use commercially acceptable means to protect your information, no method of transmission over the Internet or electronic storage is 100% secure.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Your Data Rights & Choices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Your Data Rights & Choices</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">You have rights concerning your information.</p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>For Teams and Admins:</strong> You have the right to access, correct, or request the deletion of your personal information. Please contact us to make such a request.</li>
                <li><strong>For Anonymous Users:</strong> Because your data is stored in your browser's local storage, you have full control. You can clear this data at any time by clearing your browser's cache and site data for our website.</li>
                <li><strong>"Switch Team" Functionality:</strong> If you are using a shared computer, the "Switch Team" feature in the navigation menu will log out your current team's session, allowing another team to log in securely.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Our Service is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
              </p>
            </CardContent>
          </Card>

          {/* Changes to This Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Effective Date" at the top. We encourage you to review this Privacy Policy periodically.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}