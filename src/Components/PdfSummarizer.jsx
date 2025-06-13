"use client"

import React from "react";

function PdfSummarizer() {
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

            sendData(text);
          });
        });
      });
  }

  function sendData(text) {
    fetch("/Api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(text),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data, "Data");
      });
  }
  return (
    <div>
      PdfSummarizer
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
    </div>
  );
}

export default PdfSummarizer;
