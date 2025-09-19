import { useState } from "react";
import axios from "axios";

export default function SubmitAttack({ onSuccess }) {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const buildAlertFromResponse = (resData, originalText) => {
    // prefer server-provided alert object, otherwise build a safe fallback
    if (resData && resData.alert && typeof resData.alert === "object") {
      return resData.alert;
    }
    return {
      level: resData && resData.flagged ? "CRITICAL" : "LOW",
      text: originalText,
      ts: "just now",
    };
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const text = (input || "").trim();
    if (!text) {
      setMessage("Please enter a URL or payload.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post(`${API_URL}/alerts`, { text });
      const alertObj = buildAlertFromResponse(res.data, text);

      setMessage(
        res.data && res.data.flagged
          ? "🚨 Malicious! Flagged."
          : "✅ Submitted."
      );
      setInput("");

      // Always call onSuccess with a proper alert object (so parent can prepend it)
      if (onSuccess) onSuccess(alertObj);
    } catch (err) {
      console.error("Submit error:", err);
      setMessage("Error submitting input. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-4 rounded-md shadow-md mb-6 flex flex-col sm:flex-row items-center gap-4"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter URL or payload"
        className="p-2 rounded-2xl w-full sm:w-1/2 text-white bg-gray-600"
        disabled={loading}
        aria-label="payload-input"
      />
      <button
        type="submit"
        disabled={loading}
        className={`px-4 py-2 rounded-2xl text-white ${
          loading ? "bg-gray-500" : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
      {message && <p className="text-sm mt-2 sm:mt-0">{message}</p>}
    </form>
  );
}
