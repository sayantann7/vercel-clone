import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import axios from "axios"

const BACKEND_UPLOAD_URL = "http://localhost:3001";

export function Landing() {
  const [repoUrl, setRepoUrl] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulated progress for visual feedback during deployment
  useEffect(() => {
    let interval: number | null = null;
    if (uploadId && !deployed) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 95));
      }, 1000);
    } else if (deployed) {
      setProgress(100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uploadId, deployed]);

  const handleDeploy = async () => {
    if (!repoUrl) return;
    
    setUploading(true);
    setProgress(10);
    
    try {
      const res = await axios.post(`${BACKEND_UPLOAD_URL}/deploy`, {
        repoUrl: repoUrl
      });
      setUploadId(res.data.id);
      setUploading(false);
      
      const statusInterval = setInterval(async () => {
        try {
          const response = await axios.get(`${BACKEND_UPLOAD_URL}/status?id=${res.data.id}`);
          if (response.data.status === "deployed") {
            clearInterval(statusInterval);
            setDeployed(true);
          }
        } catch (error) {
          console.error("Error checking deployment status:", error);
        }
      }, 3000);
    } catch (error) {
      console.error("Deployment error:", error);
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with Logo */}
      <div className="flex flex-col items-center pt-16 pb-8">
        <div className="flex items-center mb-6">
          <svg 
            viewBox="0 0 24 24" 
            className="w-10 h-10 text-blue-600 dark:text-blue-400 mr-2"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 2L20 7V17L12 22L4 17V7L12 2Z" 
              fill="currentColor" 
              fillOpacity="0.2"
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M12 8L16 10.5V15.5L12 18L8 15.5V10.5L12 8Z" 
              fill="currentColor" 
              stroke="currentColor" 
              strokeWidth="1.5"
            />
          </svg>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            ZipHub
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
          Deploy your web projects in seconds with just a GitHub URL.
          Simple, fast, and efficient deployment platform.
        </p>
      </div>

      <div className="container mx-auto px-4 flex flex-col items-center pb-16">
        {/* Main Deployment Card */}
        <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl border-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">Deploy your GitHub Repository</CardTitle>
            <CardDescription>Enter the URL of your GitHub repository to deploy it</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="github-url" className="font-medium">GitHub Repository URL</Label>
                <Input 
                  id="github-url"
                  onChange={(e) => setRepoUrl(e.target.value)}
                  value={repoUrl}
                  placeholder="https://github.com/username/repo" 
                  className="border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500"
                />
              </div>
              
              {uploadId && !deployed && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Deploying...</span>
                    <span className="text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleDeploy} 
                disabled={uploadId !== "" || uploading || !repoUrl} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 border-0 font-medium py-6 h-auto"
              >
                {uploadId ? `Deploying (${uploadId})` : uploading ? "Uploading..." : "Deploy Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Deployment Success Card */}
        {deployed && (
          <Card className="w-full max-w-md mt-8 bg-white dark:bg-gray-800 shadow-xl border-0 overflow-hidden animate-fadeIn">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500"></div>
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-full p-2 shadow-lg animate-bounce">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <CardHeader className="pb-2 pt-6">
              <CardTitle className="text-xl font-bold text-green-600 dark:text-green-500">Deployment Successful!</CardTitle>
              <CardDescription>Your website is now live and ready to be visited</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="deployed-url" className="font-medium">Deployed URL</Label>
                <div className="relative">
                  <Input 
                    id="deployed-url" 
                    readOnly 
                    type="url" 
                    value={`http://${uploadId}.ziphub.site`}
                    className="pr-10 bg-gray-50 dark:bg-gray-700 font-mono text-sm"
                  />
                  <button 
                    onClick={() => navigator.clipboard.writeText(`http://${uploadId}.ziphub.site`)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                    title="Copy to clipboard"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <Button className="w-full bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors duration-200 font-medium h-12">
                <a 
                  href={`http://${uploadId}.ziphub.site`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full h-full"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Visit Website
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Created by Sayantan Nandi </p>
      </footer>
      
      {/* Add global CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </main>
  )
}