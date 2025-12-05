import TrainingSessionUploader from "@/modules/component/TrainingSessionUploader";
import Uploader from "@/modules/component/Uploader";

export default function UploadPage() {
    return (
        <div className="h-screen overflow-auto bg-gray-50">
            <div className="min-h-full flex flex-col p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Upload Center</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage documents and training sessions</p>
                </div>
                
                {/* Upload Grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 auto-rows-min">
                    {/* General Documents */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">General Documents</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mb-4">Upload CSV files for Knowledge Base</p>
                        <Uploader/>
                    </div>

                    {/* Training Sessions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">Training Sessions</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mb-4">Upload CSV with embeddings</p>
                        <TrainingSessionUploader />
                    </div>
                </div>
            </div>
        </div>
    );
}