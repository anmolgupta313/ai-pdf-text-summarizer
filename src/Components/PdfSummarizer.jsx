"use client";
import stringToJson from "@/app/Function/stringToJson";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import CustomizedProgressBars from "./ProgressBar";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import CloseIcon from "@mui/icons-material/Close";
import ChatIcon from "@mui/icons-material/Chat";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Typography } from "@mui/material";

// import Moveable from "react-moveable";
function PdfSummarizer() {
  const [sumamry, setSumamry] = useState("");
  const [pdfData, setPdfDta] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [question, setQuestion] = useState([]);
  const moveableRef = useRef();
  const [rawSumamry, setRawSumamry] = useState("");
  const [animation, setAnimation] = useState(false);
  const [handleListening, SetHandleListening] = useState(false);
  // const [isDragged, setIsDragged] = useState(false);
  const [openChatBox, setOpenChatBox] = useState(false);
  const chatDivRef = useRef(null);

  const [progress, setProgress] = useState("");
  // const [question, setQuestion] = useState("how many years of experience");
  const { transcript, listening } = useSpeechRecognition();
  function onFileChange(e) {
    const file = e.target.files[0];

    const fileReader = new FileReader();
    fileReader.onload = onLoadFile;
    fileReader.readAsArrayBuffer(file);
  }

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  function startListening() {
    return SpeechRecognition.startListening();
  }

  function stopListening() {
    return SpeechRecognition.stopListening();
  }

  function onLoadFile(e) {
    const typedArray = new Uint8Array(e.target.result);

    pdfjsLib
      .getDocument({
        data: typedArray,
      })
      .promise.then(async (pdf) => {
        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();

          content.items.forEach((item) => {
            text += item.str + "";
          });
        }

        setPdfDta(text.trim());
        sendData(text.trim());
      });
  }

  const systemPrompt = `
You are a document parsera and sumarizer. Your job is to sumarize and break the input text into semantically meaningful sections based on content and structure. 

Return the result in JSON with the following format:
{
  "sections": [
    {
      "title": "Section Title",
      "content": "Cleaned up content of this section"
    }
  ]
}

Only include meaningful content. If it's a resume, detect sections like Contact Info, Summary, Skills, Experience, Projects, Education, etc.
If it's a report or article, detect sections like Introduction, Methodology, Findings, Conclusion, etc.
Do not make up information.
`;

  async function sendData(text) {
    setRawSumamry(text);

    try {
      const response = await axios.post(
        "/Api/Summary/Pdf",
        {
          prompt: systemPrompt,
          text: text,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          onUploadProgress: (progressEvent) => {
            const percentage = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setProgress(percentage);
          },
        }
      );

      stringToJson(response.data, setSumamry);
    } catch (err) {
      console.log(err);
    }
  }

  function chat(e) {
    e.preventDefault();
    const newQuestion = {
      id: question.length + 1,
      question: inputValue,
      answer: "", // placeholder until we get the answer
    };

    setQuestion((prev) => [...prev, newQuestion]);

    const currentQuestionId = newQuestion.id;

    fetch("/Api/Query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: inputValue,
        rawSumamry,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setQuestion((prev) =>
          prev.map((q) =>
            q.id === currentQuestionId ? { ...q, answer: data.answer } : q
          )
        );

        setInputValue("");

        console.log(data, "questiondata");
      });

    setInputValue("");
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
      if (inputValue == "") {
        return prev + transcript;
      } else {
        return prev + " " + transcript;
      }
    });

    if (listening == false) {
      const listeningSwitch = setTimeout(() => {
        SetHandleListening(false);
      }, 690);

      // Return a cleanup function to clear the timeout
      return () => {
        clearTimeout(listeningSwitch);
      };
    } else {
      const listeningSwitch = setTimeout(() => {
        SetHandleListening(true);
      }, 300);

      // Return a cleanup function to clear the timeout
      return () => {
        clearTimeout(listeningSwitch);
      };
    }
  }, [listening]);

  function handleChatBox() {
    setAnimation((prev) => {
      return !prev;
    });
    setTimeout(() => {
      setOpenChatBox((prev) => {
        return !prev;
      });
    }, 60);
  }

  return (
    <div className="flex flex-col gap-5 ">
      <div className="flex justify-center flex-col items-center">
        <div className="background-glass max-w-[85%] rounded-4xl py-3 flex flex-col justify-center items-center text-center ">
          <p>PDF Upload</p>
          <input
            type="file"
            accept="application/pdf"
            name="file"
            id="file"
            onChange={onFileChange}
            className="url_input pl-3 peer-focus:border-gray-700 peer-focus:text-gray-700 w-[80%] background"
          />{" "}
          {sumamry == "" && (
            <div className={sumamry == "" ? "answering-text" : "answertext"}>
              {progress < 100 ? (
                <CustomizedProgressBars progress={progress} />
              ) : sumamry == "" ? (
                "Summarizing"
              ) : (
                ""
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-5 max-h-[50%]">
        {sumamry != "" && (
          <div className="flex justify-center items-end gap-6 w-full max-h-[600px]">
            <div
              className={`summaryText background-glass max-h-[85%] overflow-auto transition-all duration-2000 ease-in-out ${
                animation ? "w-[60%]" : "w-[100%]"
              } `}
            >
              {sumamry?.sections?.map((section, idx) => (
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

            {openChatBox == false && (
              <ChatIcon
                onClick={handleChatBox}
                className="w-[100%] bg-[#ffffff3d] rounded-4xl p-1.5 cursor-pointer"
                sx={{ fontSize: "2.5rem", boxShadow: "0 8px 30px #00000040" }}
              />
            )}

            {openChatBox && (
              <div
                className={`flex gap-3 flex-col max-h-[85%] h-[100%] justify-end transition-all duration-2000 ease-in-out relative ${
                  animation ? "w-[30%]" : "w-[0%]"
                }
    ${
      openChatBox ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
    } `}
                ref={moveableRef}
              >
                <CloseIcon
                  onClick={handleChatBox}
                  className="absolute z-10 right-[28px] top-4 cursor-pointer"
                />
                {question.length > 0 && (
                  <div
                    className="form w-full px-5 py-3 justify-start items-center flex flex-col gap-5 overflow-y-auto max-h-[600px]"
                    ref={chatDivRef}
                  >
                    {question?.map((question) => {
                      return (
                        <>
                          <div className="background-glass px-5 py-3 rounded-xl flex w-[100%] justify-between ">
                            {" "}
                            <div className="w-[50%] text-start ml-4 py-2">
                              <p
                                className={
                                  question.answer == ""
                                    ? "answering-text"
                                    : "answertext"
                                }
                              >
                                <ReactMarkdown>
                                  {question.answer == ""
                                    ? "answering"
                                    : question.answer}
                                </ReactMarkdown>
                              </p>
                            </div>
                            <div className="w-[50%] text-end mr-4 py-2">
                              <p>{question.question}</p>
                            </div>
                          </div>
                        </>
                      );
                    })}
                  </div>
                )}
                <form
                  className="form w-[100%] background-glass p-7 items-center flex justify-between gap-3"
                  onSubmit={chat}
                >
                  <div className="flex justify-between w-[100%] relative items-center ">
                    <input
                      disabled={listening && "true"}
                      placeholder="Talk with your PDF"
                      // {
                      //   listening == false
                      //     ? "Talk with your PDF"
                      //     : "Listening..."
                      // }
                      id="question"
                      type="text"
                      value={inputValue}
                      onChange={handleChange}
                      className="url_input pl-3 peer-focus:border-gray-700 peer-focus:text-gray-700 w-[70%] background flex-2"
                    />

                    <div
                      className={`listening_text absolute  bg-white rounded-3xl py-1 px-3 h-auto ${
                        listening == false ? "w-[0%]" : "w-[100%]"
                      }  transition-all duration-1300 ease-in-out right-0 left-auto `}
                    >
                      <Typography className="text-xs">
                        {handleListening == false ? "" : " listening..."}
                      </Typography>
                    </div>
                    {listening == false ? (
                      <MicIcon
                        className="mick_icon z-100 bg-white rounded-3xl p-0.75  h-auto cursor-pointer"
                        sx={{ fontSize: "2rem" }}
                        onClick={startListening}
                      />
                    ) : (
                      <StopIcon
                        className="z-100  bg-white rounded-3xl p-0.75  h-auto cursor-pointer"
                        sx={{ fontSize: "2rem" }}
                        onClick={stopListening}
                      />
                    )}
                  </div>

                  <div className="flex w-[25%]">
                    <button
                      value={question?.map((value) => {
                        return value?.id;
                      })}
                      className="submit-btn w-[100%] bg-white p-1 rounded-2xl cursor-pointer  "
                      type="submit"
                    >
                      Send{" "}
                    </button>
                  </div>
                </form>

                {/* <Moveable
                  target={moveableRef.current}
                  origin={true}
                  edge={false}
                  draggable={true}
                  throttleDrag={0}
                  onDrag={({ target, transform }) => {
                    target.style.transform = transform;
                    setIsDragged(true);
                  }}
                  onDragStart={({ inputEvent }) => {
                    if (
                      inputEvent.target.tagName === "INPUT" ||
                      inputEvent.target.tagName === "TEXTAREA"
                    ) {
                      inputEvent.stopPropagation();
                      return false;
                    }
                  }}
                /> */}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfSummarizer;
