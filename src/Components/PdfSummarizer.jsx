"use client";

import stringToJson from "@/app/Function/stringToJson";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import CustomizedProgressBars from "./ProgressBar";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import ChatIcon from "@mui/icons-material/Chat";
import HistoryIcon from "@mui/icons-material/History";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Typography } from "@mui/material";
import AuthModal from "./AuthModal";
function PdfSummarizer({ user }) {
  const [summary, setSummary] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [question, setQuestion] = useState([]);
  const moveableRef = useRef();
  const [rawSummary, setRawSummary] = useState("");
  const [animation, setAnimation] = useState(false);
  const [handleListening, SetHandleListening] = useState(false);
  const [openChatBox, setOpenChatBox] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const chatDivRef = useRef(null);
  const [progress, setProgress] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [pdfId, setPdfId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [pdfList, setPdfList] = useState([]);
  const { transcript, listening } = useSpeechRecognition();
  const [fileName, setFileName] = useState("");
  // Load user's PDF library on mount (only when logged in)
  useEffect(() => {
    if (!user) return;
    fetch("/Api/Pdf/List")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPdfList(data.pdfs);
      })
      .catch(console.error);
  }, [pdfId]);

  // Load sessions when a PDF is selected
  useEffect(() => {
    if (!user || !pdfId) return;
    fetch(`/Api/Chat/Sessions/${pdfId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSessions(data.sessions);
      })
      .catch(console.error);
  }, [pdfId, user]);

  async function onFileChange(e) {
    const file = e.target.files[0];
    console.log(file.name, "namefile");
    if (!file) return;
    setFileName(file.name);
    setProgress(0);
    setSummary("");
    setQuestion([]);
    setSessionId(null);

    if (user) {
      // Authenticated: upload to server, get pdfId back
      const formData = new FormData();
      formData.append("pdf", file);

      try {
        const response = await axios.post("/Api/Summary/Pdf", formData, {
          onUploadProgress: (progressEvent) => {
            const pct = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setProgress(pct);
          },
        });

        if (response.data.success) {
          setPdfId(response.data.pdfId);
          setRawSummary(""); // not needed when using pdfId
          stringToJson(response.data, setSummary);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Unauthenticated: old client-side pdf.js flow
      const fileReader = new FileReader();
      fileReader.onload = onLoadFile;
      fileReader.readAsArrayBuffer(file);
    }
  }

  // Old client-side flow (unauthenticated only)
  function onLoadFile(e) {
    const typedArray = new Uint8Array(e.target.result);
    pdfjsLib.getDocument({ data: typedArray }).promise.then(async (pdf) => {
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        content.items.forEach((item) => {
          text += item.str + "";
        });
      }
      setRawSummary(text.trim());
      sendDataJson(text.trim());
    });
  }

  function resetAll() {
    setSummary("");
    setQuestion([]);
    setSessionId(null);
    setPdfId(null);
    setProgress(0);
    setOpenChatBox(false);
    setAnimation(false);
    setOpenHistory(false);
  }

  const systemPrompt = `
You are a document parser and summarizer. Your job is to summarize and break the input text into semantically meaningful sections based on content and structure.
Return the result in JSON with the following format:
{ "sections": [{ "title": "Section Title", "content": "Cleaned up content" }] }
Only include meaningful content. Do not make up information.
`;

  async function sendDataJson(text) {
    try {
      const response = await axios.post(
        "/Api/Summary/Pdf",
        { prompt: systemPrompt, text },
        {
          headers: { "Content-Type": "application/json" },
          onUploadProgress: (progressEvent) => {
            const pct = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setProgress(pct);
          },
        },
      );
      stringToJson(response.data, setSummary);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadSession(session) {
    try {
      const res = await fetch(`/Api/Chat/Messages/${session._id}`);
      const data = await res.json();
      if (data.success) {
        setQuestion(data.questions);
        setSessionId(session._id);
        setOpenHistory(false);
        setOpenChatBox(true);
        setAnimation(true);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadPdfFromHistory(pdf) {
    setPdfId(pdf._id);
    setQuestion([]);
    setSessionId(null);
    setOpenHistory(false);
    // Re-fetch summary from DB using pdfId
    try {
      const res = await axios.post(
        "/Api/Summary/Pdf",
        { pdfId: pdf._id },
        { headers: { "Content-Type": "application/json" } },
      );
      if (res.data.success) {
        stringToJson(res.data, setSummary);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function chat(e) {
    e.preventDefault();
    const newQuestion = {
      id: question.length + 1,
      question: inputValue,
      answer: "",
    };
    setQuestion((prev) => [...prev, newQuestion]);
    const currentQuestionId = newQuestion.id;

    const body = pdfId
      ? { question: inputValue, pdfId, sessionId } // authenticated path
      : { question: inputValue, rawSumamry: rawSummary }; // legacy path

    fetch("/Api/Query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data) => {
        setQuestion((prev) =>
          prev.map((q) =>
            q.id === currentQuestionId ? { ...q, answer: data.answer } : q,
          ),
        );
        setIsAnswering(false);

        // Capture sessionId returned from server on first message
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
          // Refresh session list
          if (pdfId) {
            fetch(`/Api/Chat/Sessions/${pdfId}`)
              .then((r) => r.json())
              .then((d) => {
                if (d.success) setSessions(d.sessions);
              });
          }
        }
        setInputValue("");
      });

    setInputValue("");
    setIsAnswering(true);
  }

  async function deletePdf(e, pdf) {
    e.stopPropagation();
    if (!confirm(`Delete "${pdf.originalName}" and all its chats?`)) return;
    try {
      const res = await fetch(`/Api/Pdf/${pdf._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPdfList((prev) => prev.filter((p) => p._id !== pdf._id));
        if (pdfId === pdf._id) resetAll();
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (chatDivRef.current) {
      chatDivRef.current.scrollTo({
        top: chatDivRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [question]);

  useEffect(() => {
    setInputValue((prev) => {
      if (inputValue === "") return prev + transcript;
      return prev + " " + transcript;
    });
    if (listening === false) {
      const t = setTimeout(() => SetHandleListening(false), 690);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => SetHandleListening(true), 300);
      return () => clearTimeout(t);
    }
  }, [listening]);

  useEffect(() => {
    setProgress(0);
  }, [summary]);

  function handleChatBox() {
    setAnimation((prev) => !prev);
    setTimeout(() => setOpenChatBox((prev) => !prev), 60);
  }

  return (
    <div className="flex flex-col gap-5">
      {user ? (
        <div>
          <div className="flex justify-center flex-col items-center">
            <div className="background-glass w-[310px] xs:max-w-[360px] sm:max-w-[400px] rounded-4xl py-3 flex flex-col justify-center items-center text-center ">
              <p>PDF Upload</p>
              <label
                htmlFor="file"
                className="url_input pl-3 peer-focus:border-gray-700 peer-focus:text-gray-700 w-[80%] background cursor-pointer"
              >
                {" "}
                Choose File
                <input
                  value=""
                  type="file"
                  accept="application/pdf"
                  name="file"
                  id="file"
                  onChange={onFileChange}
                  className="hidden url_input pl-3 peer-focus:border-gray-700 peer-focus:text-gray-700 w-[80%] background cursor-pointer"
                />
              </label>
              {summary == "" && <p> {fileName}</p>}
              {(summary === "" || progress === 100) && (
                <div
                  className={`dark:text-black ${
                    progress === 100 ? "answering-text" : "answertext"
                  }`}
                >
                  {progress < 100 ? (
                    <CustomizedProgressBars progress={progress} />
                  ) : (
                    <p>Summarizing...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PDF Library (logged-in users) */}
          {user && pdfList.length > 0 && (
            <div className="flex justify-center mt-[1.5rem]">
              <div className="background-glass rounded-4xl py-3 px-5 max-w-[310px] xs:max-w-[360px] sm:max-w-[400px]">
                <p className="font-semibold mb-2">Your PDFs</p>
                <div className="flex gap-2  relative overflow-x-scroll max-w-[100%]">
                  {pdfList.map((pdf) => (
                    <div
                      key={pdf._id}
                      className={`relative flex items-center gap-1 background-glass rounded-3xl text-sm cursor-pointer hover:opacity-80 min-w-fit py-2 px-3 ${
                        pdfId === pdf._id ? "ring-1 ring-white/60" : ""
                      }`}
                    >
                      <button
                        disabled={isAnswering === true}
                        onClick={() => loadPdfFromHistory(pdf)}
                        className={`pr-4 ${isAnswering === true ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      >
                        {pdf.originalName.length > 21
                          ? pdf.originalName.slice(0, 21) + "..."
                          : pdf.originalName}
                      </button>
                      {/* Delete PDF button */}
                      <button
                        disabled={isAnswering === true}
                        onClick={(e) => deletePdf(e, pdf)}
                        sx={{ fontSize: "2rem" }}
                        className={`flex justify-center items-center  bg-white rounded-[50%] text-black    transition-colors ${isAnswering === true ? "cursor-not-allowed opacity-50 " : "cursor-pointer hover:text-red-600 dark:hover:text-white dark:hover:bg-white/50"}`}
                        title="Delete PDF"
                      >
                        <DeleteIcon
                          sx={{ fontSize: "1.2rem", padding: ".2rem" }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-5 max-h-[50%]">
            {summary !== "" && (
              <div className="flex justify-center items-end sm:gap-6 w-full max-h-[600px]">
                <div
                  className={`summaryText background-glass max-h-[85%] overflow-auto transition-all duration-2000 ease-in-out w-[100%] ${animation ? "md:w-[60%]" : "md:w-[100%]"}`}
                >
                  {summary?.sections?.map((section, idx) => (
                    <div key={idx} className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">
                        {section.title}
                      </h3>
                      {section.content.split("\n").map((line, i) => (
                        <p key={i} className="text-sm mb-1">
                          {line}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  {openChatBox === false && (
                    <ChatIcon
                      onClick={handleChatBox}
                      className="w-[100%] bg-[#ffffff3d] rounded-4xl p-1.5 cursor-pointer md:relative fixed right-3 bottom-3"
                      sx={{
                        fontSize: "2.5rem",
                        boxShadow: "0 8px 30px #00000040",
                      }}
                    />
                  )}
                </div>

                {openChatBox && (
                  <div
                    className={` z-100 flex gap-3 px-3 flex-col max-h-[85%] min-h-[15%] md:h-[100%] justify-end transition-all duration-2000 ease-in-out md:relative fixed bottom-2 w-[100%] ${animation ? "md:w-[30%]" : "md:w-[0%]"} ${openChatBox ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}
                    ref={moveableRef}
                  >
                    <CloseIcon
                      onClick={handleChatBox}
                      sx={{ fontSize: "1rem" }}
                      className="absolute z-10  right-[36px] top-4 cursor-pointer"
                    />
                    {question.length > 0 && (
                      <div
                        className="form w-full px-5 py-3 justify-start items-center flex flex-col gap-5 overflow-y-auto max-h-[600px]"
                        ref={chatDivRef}
                      >
                        {question.map((q) => (
                          <div
                            key={q.id}
                            className="background-glass px-5 py-3 rounded-xl flex w-[100%] justify-between"
                          >
                            <div className="w-[50%] text-start  py-2">
                              <div
                                className={
                                  q.answer === ""
                                    ? "answering-text"
                                    : "answertext"
                                }
                              >
                                <ReactMarkdown>
                                  {q.answer === "" ? "answering" : q.answer}
                                </ReactMarkdown>
                              </div>
                            </div>
                            <div className="w-[50%] text-end mr-4 py-2">
                              <p>{q.question}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Past sessions panel */}
                    {openHistory && (
                      <div className="background-glass rounded-2xl p-4  right-4 z-20 min-w-[220px]">
                        <div className="flex justify-between items-center mb-3">
                          <p className="font-semibold text-sm">Chat history</p>
                          <CloseIcon
                            onClick={() => setOpenHistory(false)}
                            className="cursor-pointer"
                            sx={{ fontSize: "1rem" }}
                          />
                        </div>
                        <div className="relative overflow-y-auto max-h-[50%]">
                          {sessions.map((s) => (
                            <button
                              key={s._id}
                              onClick={() => loadSession(s)}
                              className="block w-full text-left px-3 py-2 rounded-xl hover:bg-white/20 text-sm mb-1 cursor-pointer"
                            >
                              {s.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <form
                      className="form w-[100%] background-glass p-7 items-center flex justify-between gap-3"
                      onSubmit={chat}
                    >
                      <div>
                        {" "}
                        {user &&
                          sessions.length > 0 &&
                          openChatBox === true && (
                            <HistoryIcon
                              onClick={() => setOpenHistory((p) => !p)}
                              className="w-[100%] bg-[#ffffff3d] rounded-4xl p-1.5 cursor-pointer"
                              sx={{
                                fontSize: "2.3rem",
                                boxShadow: "0 8px 30px #00000040",
                              }}
                            />
                          )}
                      </div>
                      <div className="flex justify-between w-[100%] relative items-center">
                        <input
                          disabled={listening && "true"}
                          placeholder="Talk with your PDF"
                          id="question"
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          className="url_input pl-3 peer-focus:border-gray-700 peer-focus:text-gray-700 w-[70%] background flex-2"
                        />
                        <div
                          className={`listening_text absolute bg-white rounded-3xl py-1 px-3 h-auto ${listening === false ? "w-[0%]" : "w-[100%]"} transition-all duration-1300 ease-in-out right-0 left-auto`}
                        >
                          <Typography className="text-xs">
                            {handleListening === false ? "" : " listening..."}
                          </Typography>
                        </div>

                        {listening === false ? (
                          <MicIcon
                            className="mick_icon z-100 bg-white dark:text-black rounded-3xl p-0.75 h-auto cursor-pointer"
                            sx={{ fontSize: "2rem" }}
                            onClick={() => SpeechRecognition.startListening()}
                          />
                        ) : (
                          <StopIcon
                            className="z-100 bg-white dark:text-black rounded-3xl p-0.75 h-auto cursor-pointer"
                            sx={{ fontSize: "2rem" }}
                            onClick={() => SpeechRecognition.stopListening()}
                          />
                        )}
                      </div>
                      <div className="flex w-[25%]">
                        <button
                          disabled={inputValue == ""}
                          className={[
                            `submit-btn w-[100%] bg-white dark:text-black p-1 rounded-2xl  ${inputValue == "" ? "cursor-not-allowed opacity-50" : "cursor-pointer"} `,
                          ]}
                          type="submit"
                        >
                          Send
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        showModal == true && <AuthModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default PdfSummarizer;
