import Sidebar from './Sidebar';

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Sidebar />
      <div className="lg:ml-72 transition-all duration-300">
        <div className="flex items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Coming Soon
          </h1>
        </div>
      </div>
    </div>
  );
}
