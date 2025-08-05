"use client";

import React, { useState } from "react";

function PdfSummarizer() {
  const [sumamry, setSumamry] = useState("");
  const [pdfData, setPdfDta] = useState("");
  // const [question, setQuestion] = useState("how many years of experience");
  function onFileChange(e) {
    const file = e.target.files[0];

    const fileReader = new FileReader();
    fileReader.onload = onLoadFile;
    fileReader.readAsArrayBuffer(file);
  }

  function onLoadFile(e) {
    const typedArray = new Uint8Array(e.target.result);

    pdfjsLib
      .getDocument({
        data: typedArray,
      })
      .promise.then((pdf) => {
        pdf.getPage(1).then((page) => {
          page.getTextContent().then((content) => {
            let text = "";
            content.items.forEach((item) => {
              text += item.str + "";
            });
            setPdfDta(text);
            sendData(text);
          });
        });
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

  function sendData(text) {
    fetch("/Api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: systemPrompt,
        text: text,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        const jsonStartIndex = data.sumamry.indexOf("{");
        const jsonEndIndex = data.sumamry.lastIndexOf("}") + 1;

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          const jsonString = data.sumamry.substring(
            jsonStartIndex,
            jsonEndIndex
          );
          try {
            const extractedObject = JSON.parse(jsonString);
            setSumamry(extractedObject);
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }
      });
  }

  function chat() {
    fetch("/Api/Query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: "What is number of experience?",
        sumamry,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data, "questiondata");
      });
  }

  return (
    <div>
      <div>
        <p>PDF Upload</p>
        <input
          type="file"
          accept=".pdf"
          name="file"
          id="file"
          onChange={onFileChange}
        />
      </div>

      {pdfData != "" && (
        <div className="summaryText background-glass w-[70%]">
          {sumamry?.sections?.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
              {section.content.split("\n").map((line, i) => (
                <p key={i} className="text-sm mb-1">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      <button onClick={chat}>clikc me </button>
    </div>
  );
}

export default PdfSummarizer;
