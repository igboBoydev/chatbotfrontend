import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ChatbotUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code
          {...props}
          style={{
            backgroundColor: "#f3f4f6",
            padding: "2px 4px",
            borderRadius: "4px",
            fontSize: "0.85em",
          }}
        >
          {children}
        </code>
      );
    },
    h1: ({ node, ...props }) => (
      <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-xl font-semibold mt-3 mb-2" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-lg font-semibold mt-2 mb-1" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside ml-5 my-2" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal list-inside ml-5 my-2" {...props} />
    ),
    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://13.217.166.244/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();

      const botMessage = {
        sender: "bot",
        text: data.answer,
        resources: data.resources || [],
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // Copy handler with popup
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Chat Area */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-grow flex items-center justify-center text-gray-500 text-center px-4">
            <div>
              <p className="mb-4 text-lg font-semibold">Welcome! Ask me anything.</p>
              <p className="italic text-sm">Start by typing a question below.</p>
            </div>
          </div>
        ) : (
          <div
            ref={chatContainerRef}
            className="flex-grow overflow-y-auto px-4 py-3 space-y-4 pb-24"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative p-3 rounded-lg whitespace-pre-line break-words w-full sm:max-w-[80%] ${msg.sender === "user"
                    ? "bg-blue-100 text-right rounded-tr-none"
                    : "bg-gray-200 text-left rounded-tl-none"
                    }`}
                >
                  {msg.sender === "bot" && (
                    <>
                      <button
                        onClick={() => handleCopy(msg.text, i)}
                        title="Copy response"
                        className="absolute top-1 right-1 p-1 rounded hover:bg-gray-300 focus:outline-none"
                        aria-label="Copy bot response"
                        type="button"
                      >
                        {/* Clipboard SVG icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 8h6a2 2 0 002-2v-2a2 2 0 00-2-2h-6a2 2 0 00-2 2v2a2 2 0 002 2z"
                          />
                        </svg>
                      </button>

                      {/* Popup message */}
                      {copiedMessageIndex === i && (
                        <div
                          className="absolute top-8 right-1 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg select-none
                            opacity-100 transition-opacity duration-300"
                          style={{ zIndex: 1000 }}
                        >
                          Copied to clipboard
                        </div>
                      )}
                    </>
                  )}

                  <ReactMarkdown components={markdownComponents}>
                    {msg.text}
                  </ReactMarkdown>

                  {msg.resources?.length > 0 && (
                    <ul className="mt-3 text-sm list-disc list-inside">
                      {msg.resources.map((r, j) => (
                        <li key={j}>
                          <a
                            href={r.url}
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            {r.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-center space-x-2">
                <svg
                  className="animate-spin h-6 w-6 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                <span className="text-gray-600 italic">Bot is typing...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="sticky bottom-0 w-full px-4 py-3 bg-white border-t flex items-center space-x-2 z-10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something..."
          disabled={loading}
          className="flex-grow border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          ) : (
            "Send"
          )}
        </button>
      </div>
    </div>
  );
}
