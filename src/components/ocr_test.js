import React, { useState } from 'react';
import axios from 'axios';

import {OpenAIClient} from '@azure/openai';
import {AzureKeyCredential} from '@azure/core-auth';

const endpoint = "https://kic-2024-openai.openai.azure.com/";
const azureApiKey = "f8ac1f51bb7b42e096cb1d08a9e1666e";
const deploymentId = "51e134d9-5b8c-44dd-be2e-9b15ee4b1f39";

const OCRComponent = () => {
  const [inferTexts, setInferTexts] = useState([]);
  const [messages, setMessages] = useState([]);

  // const handleSendMessage = async (e, type) => {
    
  // }


  const handleOCRRequest = async () => {
    const apiURL = '/custom/v1/28428/e05ad392dca9ecc29b1b6e0d8dcfdd1fb690788828117452df157f0cfba2d425/general';
    const secretKey = 'T05oaGJVVEN1a2l2WFpzbGN3YkplYXJlZHBlUmN5clQ=';

    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      const requestJson = {
        images: [
          {
            format: 'jpg',
            name: 'demo'
          }
        ],
        requestId: Math.random().toString(36).substring(7),
        version: 'V2',
        timestamp: Math.round(new Date().getTime())
      };
      formData.append('message', JSON.stringify(requestJson))
      console.log(formData);

      try {
        const response = await axios.post(apiURL, formData, {
          headers: {
            'X-OCR-SECRET': secretKey,
            'Content-Type': 'multipart/form-data'
          }
        });

        const data = response.data;
        const extractedTexts = data.images.flatMap(image => image.fields.map(field => field.inferText));
        setInferTexts(extractedTexts);
        
        console.log(extractedTexts)
        let inferTextsString = extractedTexts.join('');
        console.log(inferTextsString);

        const message = [                        // 프롬프트
          {role: "system", content: `Analyze the given receipt text in Korean to identify and extract only the product names (items) and their corresponding approval numbers or tax deduction numbers. The receipt may list various items, and the approval number or tax deduction number is typically located immediately after the words "승인번호" or "공제번호". Ensure to extract this information accurately and format the output in JSON, adhering to these guidelines:
            - Product names can vary widely and may include any item listed on the receipt.
            - The approval or tax deduction number follows the label "승인번호" or "공제번호" directly and can be alphanumeric.
            - The required output is a JSON object containing an array of entries, each with the item name and its corresponding approval number or tax deduction number.

            The JSON format should enable easy identification of each item along with its approval or tax deduction number, excluding all unrelated information. Provide a clear and concise output that reflects the diverse nature of items that could appear on a receipt and the specific manner in which approval numbers are presented.

            Example of the improved JSON output format:

            {
              "extracted_data": [
                {
                  "item": "<item_name_1>",
                  "approval_number": "<approval_number_1>"
                },
                {
                  "item": "<item_name_2>",
                  "approval_number": "<approval_number_2>"
                },
                // Add more items as necessary
              ]
            }

            Please focus on extracting this information precisely and ensure that the JSON output is structured to provide a clear representation of the extracted data, making no assumptions about the item types or specific formats of approval numbers.`},
          { role: "user", content: `${inferTextsString}` },
        ];

        console.log("== Post GPT API ==");

        const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
        const result = await client.getChatCompletions(deploymentId, message);

        
        for (const choice of result.choices) {
          console.log(choice.message);
          // const summary = choice.message["transaction_analysis"]["recommendations"]

          // const summary_messages = [                        // 프롬프트
          //   { role: "user", content: `Please translate ${summary} into Korean` },
          // ];
          const newMessage = {
            id: Date.now(),
            sender: "bot",
            text: choice.message.content,
          };

          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
        console.log(messages);
      } catch (error) {
        console.error('Error occurred while performing OCR:', error);
      }
    }
  };

  

  return (
    <div>
      <label>
        <input type="file" id="fileInput" />
        <button onClick={handleOCRRequest}>Perform OCR</button>
      </label>
      <ul>
        {inferTexts.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ul>
    </div>
  );
};

export default OCRComponent;
