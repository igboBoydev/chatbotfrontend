import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ChatbotUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);


  // Custom renderers for markdown components
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
    h1: ({ children }) => <h1 className="font-bold text-xl mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="font-bold text-lg mb-1">{children}</h2>,
    h3: ({ children }) => <h3 className="font-bold text-md mb-1">{children}</h3>,
    ol: ({ children }) => <ol className="list-decimal ml-6">{children}</ol>,
    ul: ({ children }) => <ul className="list-disc ml-6">{children}</ul>,
    li: ({ children }) => <li className="mb-1">{children}</li>,
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
            className="flex-grow overflow-y-auto px-4 py-3 space-y-4"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-lg whitespace-pre-line break-words w-full sm:max-w-[80%] ${msg.sender === "user"
                    ? "bg-blue-100 text-right rounded-tr-none"
                    : "bg-gray-200 text-left rounded-tl-none"
                    }`}
                >
                  {msg.sender === "bot" ? (
                    <div
                      className={`p-3 rounded-lg whitespace-pre-line break-words max-w-full sm:max-w-[80%] ${msg.sender === "user"
                        ? "bg-blue-100 text-right rounded-tr-none"
                        : "bg-gray-200 text-left rounded-tl-none"
                        }`}
                    >
                      <ReactMarkdown components={markdownComponents}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-gray-800">{msg.text}</p>
                  )}

                  {msg.resources?.length > 0 && (
                    <ul className="mt-2 text-sm list-disc list-inside">
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
      <div className="w-full px-4 py-3 bg-white border-t flex items-center space-x-2">
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
