import { useState } from "react";
import axios from "axios";

export default function SubmitAttack({ onSuccess }) {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!input) return;

    try {
      const res = await axios.post("http://localhost:8001/alerts", {
        text: input,
      });
      setMessage(res.data.flagged ? "🚨 Malicious! Flagged." : "✅ Safe.");
      setInput("");
      if (res.data.flagged && onSuccess) onSuccess(res.data.alert);
    } catch (err) {
      setMessage("Error submitting input");
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-md shadow-md mb-6 flex flex-col sm:flex-row items-center sm:items-center gap-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter URL or payload"
        className="p-2 rounded-2xl  w-full sm:w-1/2 text-white bg-gray-600 flex justify-center"
      />
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-2xl  text-white"
      >
        Submit
      </button>
      {message && <p className="text-sm mt-2 sm:mt-0">{message}</p>}
    </div>
  );
}
