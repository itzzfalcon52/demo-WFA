export default function ModelUpdates({ model }) {
  if (!model) return null;

  return (
    <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-500 to-indigo-700 shadow-lg hover:scale-105 transition-all space-y-2">
      <h2 className="text-xl font-bold mb-2 text-white flex items-center">
        <span className="inline-block w-3 h-3 rounded-full bg-green-300 animate-pulse mr-2"></span>
        Model Updates
      </h2>
      <p className="flex justify-between text-white">
        <span className="text-gray-200">Version:</span>{" "}
        <span className="font-bold">{model.version || "N/A"}</span>
      </p>
      {model.accuracy && (
        <p className="flex justify-between text-white">
          <span className="text-gray-200">Accuracy:</span>{" "}
          <span className="font-bold">{model.accuracy}%</span>
        </p>
      )}
      <p className="flex justify-between text-white">
        <span className="text-gray-200">Last Retrain:</span>{" "}
        <span className="font-bold">{model.last_retrain || "N/A"}</span>
      </p>
      {model.incremental_data && (
        <p className="flex justify-between text-white">
          <span className="text-gray-200">Incremental Data:</span>{" "}
          <span className="font-bold">{model.incremental_data}</span>
        </p>
      )}
    </div>
  );
}
