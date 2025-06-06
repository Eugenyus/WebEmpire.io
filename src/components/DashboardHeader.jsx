const DashboardHeader = ({ fullName }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 mb-8">
    <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
      Welcome back{fullName ? ` ${fullName}` : ''}!
    </h1>
    <p className="text-gray-600">Here's what's happening with your projects today.</p>
  </div>
);

export default DashboardHeader;