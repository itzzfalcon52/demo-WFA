export default function IngestionStatus({ ingestion }) {
  if (!ingestion) return null;
  const { batch, streaming } = ingestion;

  return (
    <div className="space-y-4">
      {batch && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-green-400 to-green-700 shadow-lg hover:scale-105 transition-all">
          <h3 className="font-semibold text-lg text-white mb-2 flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-200 animate-pulse mr-2"></span>
            Batch Ingestion
          </h3>
          <p className="text-white">
            <span className="text-gray-200">Status:</span>{" "}
            <span className="font-bold">{batch.status}</span>
          </p>
          <p className="text-white">
            <span className="text-gray-200">Logs:</span>{" "}
            <span className="font-bold">{batch.logs?.toLocaleString()}</span>
          </p>
          <p className="text-white">
            <span className="text-gray-200">Last Run:</span>{" "}
            <span className="font-bold">{batch.last_run}</span>
          </p>
        </div>
      )}

      {streaming && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg hover:scale-105 transition-all">
          <h3 className="font-semibold text-lg text-white mb-2 flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-200 animate-pulse mr-2"></span>
            Streaming Ingestion
          </h3>
          <p className="text-white">
            <span className="text-gray-200">Status:</span>{" "}
            <span className="font-bold">{streaming.status}</span>
          </p>
          <p className="text-white">
            <span className="text-gray-200">Rate:</span>{" "}
            <span className="font-bold">{streaming.rate}</span>
          </p>
        </div>
      )}
    </div>
  );
}
